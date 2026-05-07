import React, { useState } from "react";
import { getIncomingProducts, acceptProduct, rejectProduct, getUserByEmail, STAGE_COLORS, STAGE_EMOJIS } from "../utils/store";
import { PackageCheck, PackageX, ChevronDown, ChevronUp, Inbox } from "lucide-react";

export default function IncomingProducts({ userEmail, onUpdate }) {
  const [expanded, setExpanded] = useState(true);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(null);

  const incoming = getIncomingProducts(userEmail);

  if (incoming.length === 0) return null;

  const handleAccept = (blockchainId) => {
    setProcessing(blockchainId);
    try {
      acceptProduct(blockchainId, userEmail);
      onUpdate?.();
    } catch (err) {
      console.error("Accept error:", err);
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = (blockchainId) => {
    setProcessing(blockchainId);
    try {
      rejectProduct(blockchainId, userEmail, rejectReason);
      setRejectingId(null);
      setRejectReason("");
      onUpdate?.();
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-[#e8604c]/30 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#e8604c]/10 to-[#e8604c]/5 hover:from-[#e8604c]/15 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#e8604c] flex items-center justify-center">
            <Inbox className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-sm">Incoming Products</h3>
            <p className="text-xs text-gray-500">Products awaiting your acceptance</p>
          </div>
          <span className="ml-2 px-2.5 py-1 bg-[#e8604c] text-white text-xs font-bold rounded-full">
            {incoming.length}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
      </button>

      {/* Product list */}
      {expanded && (
        <div className="divide-y divide-gray-100">
          {incoming.map((product) => {
            const sender = getUserByEmail(product.previousOwner);
            const senderName = sender?.fullName || product.previousOwner || "Unknown";
            const stageColor = STAGE_COLORS[product.currentStage] || "bg-gray-100 text-gray-600";
            const stageEmoji = STAGE_EMOJIS[product.currentStage] || "\u{1F4E6}";
            const isProcessing = processing === product.blockchainId;
            const isRejecting = rejectingId === product.blockchainId;

            return (
              <div key={product.blockchainId} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900 text-sm truncate">{product.productName}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${stageColor}`}>
                        {stageEmoji} {product.currentStage}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">BLK-{product.blockchainId}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-gray-500">
                      <span>From: <strong className="text-gray-700">{senderName}</strong></span>
                      {product.category && <span>Category: {product.category}</span>}
                      {product.currentPrice && <span className="text-[#2a7c7c] font-semibold">${product.currentPrice}</span>}
                    </div>
                  </div>

                  {/* Action buttons */}
                  {!isRejecting && (
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleAccept(product.blockchainId)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={() => setRejectingId(product.blockchainId)}
                        disabled={isProcessing}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                      >
                        <PackageX className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>

                {/* Reject reason input */}
                {isRejecting && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl space-y-2">
                    <p className="text-xs font-medium text-red-700">Why are you rejecting this product?</p>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Enter reason for rejection..."
                      rows={2}
                      className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(""); }}
                        className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleReject(product.blockchainId)}
                        disabled={isProcessing}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                      >
                        Confirm Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
