import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getMyProducts, getPreviousOwnerProducts, canUserActOnProduct,
  selfActionOnProduct, transferProduct, closeProduct,
  STAGE_COLORS, STAGE_EMOJIS, CATEGORIES,
} from "../utils/store";
import CategoryNav from "../components/CategoryNav";
import ActionModal from "../components/ActionModal";
import ReceiptModal from "../components/ReceiptModal";
import TrackingTimeline from "../components/TrackingTimeline";
import VideoHero from "../components/VideoHero";
import IncomingProducts from "../components/IncomingProducts";
import { Package, Eye, X, TrendingUp, Lock } from "lucide-react";

export default function ProcessorPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [trackModal, setTrackModal] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const role = user?.preferredRole || user?.role || "processor";
  const myProducts = getMyProducts(user?.email).filter((p) => p.status !== "closed" && (!category || p.category === category));
  const previousProducts = getPreviousOwnerProducts(user?.email).filter((p) => !category || p.category === category);

  const [processWarning, setProcessWarning] = useState(null);

  const handleActionComplete = (result) => {
    const p = actionModal.product;

    // Warn if transferring without processing
    if (result.flowType === "transfer") {
      const unprocessedStages = ["Registered", "Transferred", "Received for Processing", "Received for Roasting", "Received for Manufacturing", "Received for Export", "Received for Retail", "Received at Warehouse", "In Transit", "Accepted"];
      if (unprocessedStages.includes(p.currentStage)) {
        setProcessWarning({ product: p, result });
        return;
      }
    }

    executeAction(p, result);
  };

  const executeAction = (p, result) => {
    if (result.flowType === "self") {
      selfActionOnProduct(p.blockchainId, user?.email, result);
    } else if (result.flowType === "transfer") {
      const res = transferProduct(p.blockchainId, user?.email, result.receiverEmail, result);
      if (res?.receipt) setReceiptModal(res.receipt);
    } else if (result.flowType === "sell") {
      const res = closeProduct(p.blockchainId, user?.email, result);
      if (res?.receipt) setReceiptModal(res.receipt);
    }
    setActionModal(null);
    setRefresh((r) => r + 1);
  };

  /* ── Computed Stats ── */
  const totalProcessed = myProducts.length + previousProducts.length;
  const queueCount = myProducts.filter((p) => p.currentStage === "harvested" || p.currentStage === "collected").length;
  const totalRevenue = myProducts.reduce((s, p) => s + (p.currentPrice || 0), 0);
  const batchesCompleted = previousProducts.length;

  const progressStats = [
    {
      label: "Processing Queue",
      value: queueCount,
      max: Math.max(totalProcessed, 1),
      color: "from-amber-400 to-orange-500",
      barColor: "bg-gradient-to-r from-amber-400 to-orange-500",
      iconBg: "bg-amber-100 text-amber-600",
    },
    {
      label: "Revenue",
      value: `$${totalRevenue}`,
      numericValue: totalRevenue,
      max: Math.max(totalRevenue, 1000),
      color: "from-teal-400 to-[#2a7c7c]",
      barColor: "bg-gradient-to-r from-teal-400 to-[#2a7c7c]",
      iconBg: "bg-teal-100 text-[#2a7c7c]",
    },
    {
      label: "Batches Completed",
      value: batchesCompleted,
      max: Math.max(totalProcessed, 1),
      color: "from-orange-400 to-amber-600",
      barColor: "bg-gradient-to-r from-orange-400 to-amber-600",
      iconBg: "bg-orange-100 text-orange-600",
    },
  ];

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ── Video Hero Banner ── */}
      <VideoHero
        page="processor"
        innerPage
        title={<>{"\u{1F3ED}"} {user?.fullName} <span className="capitalize">({role})</span></>}
        subtitle="Process, roast, and route products through the supply chain"
      />

      {/* ── Incoming Products ── */}
      <IncomingProducts userEmail={user?.email} onUpdate={() => setRefresh((r) => r + 1)} />

      {/* ── Category Filter ── */}
      <CategoryNav selected={category} onSelect={setCategory} />

      {/* ── Hero Stat Card: Total Products Processed ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-[#2a7c7c] p-6 shadow-lg">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/10 -translate-y-12 translate-x-12" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-8 -translate-x-8" />
        <div className="relative z-10 flex items-center gap-5">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm shadow-inner">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-white/80 text-sm font-medium tracking-wide uppercase">Total Products Processed</p>
            <p className="text-5xl font-extrabold text-white leading-tight">{totalProcessed}</p>
            <p className="text-white/60 text-xs mt-1">{myProducts.length} active &middot; {batchesCompleted} completed</p>
          </div>
        </div>
      </div>

      {/* ── Progress Stat Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {progressStats.map((s) => {
          const pct = typeof s.numericValue === "number"
            ? Math.min((s.numericValue / s.max) * 100, 100)
            : Math.min((s.value / s.max) * 100, 100);
          return (
            <div key={s.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                  {s.label === "Processing Queue" && <Package className="w-5 h-5" />}
                  {s.label === "Revenue" && <TrendingUp className="w-5 h-5" />}
                  {s.label === "Batches Completed" && <Lock className="w-5 h-5" />}
                </div>
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{s.label}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-3">{s.value}</p>
              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${s.barColor} transition-all duration-700`}
                  style={{ width: `${Math.max(pct, 4)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quick Action Buttons ── */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setCategory(null)}
          className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          View All Products
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCategory(c.id)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              category === c.id
                ? "bg-[#2a7c7c] text-white border-[#2a7c7c] shadow-md"
                : "bg-white text-gray-600 border-gray-200 hover:border-amber-300 hover:text-amber-700 hover:bg-amber-50"
            }`}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {/* ── My Products Section ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">My Products</h2>
              <p className="text-xs text-gray-500">{myProducts.length} product{myProducts.length !== 1 ? "s" : ""} in your inventory</p>
            </div>
          </div>
        </div>

        {myProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-5">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-amber-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No products owned yet</p>
            <p className="text-xs text-gray-300 mt-1">Products will appear here once received</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {myProducts.map((p, i) => {
              const isOwner = canUserActOnProduct(user?.email, p);
              const catInfo = CATEGORIES.find((c) => c.id === p.category);
              return (
                <div
                  key={i}
                  className="group relative border border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-amber-200 transition-all duration-200 bg-white"
                >
                  {/* Accent stripe */}
                  <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-amber-400 via-orange-400 to-[#2a7c7c] opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-base leading-snug">{p.productName}</h3>
                    <div className="flex gap-1.5 flex-shrink-0 ml-2">
                      {catInfo && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          {catInfo.emoji}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STAGE_COLORS[p.currentStage] || "bg-gray-100"}`}>
                        {STAGE_EMOJIS[p.currentStage] || ""} {p.currentStage}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 mb-4">
                    <p className="text-xs text-gray-400 font-mono">{"\u{1F3F7}\uFE0F"} {p.batchId}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-extrabold text-amber-600">${p.currentPrice || p.initialPrice}</span>
                      {p.initialPrice && p.currentPrice && p.currentPrice !== p.initialPrice && (
                        <span className="text-[10px] text-gray-400 line-through">${p.initialPrice}</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {isOwner && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50">
                      <button
                        onClick={() => setActionModal({ product: p })}
                        className="flex-1 min-w-[80px] px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md active:scale-[0.97]"
                      >
                        Proceed
                      </button>
                      <button
                        onClick={() => setTrackModal(p)}
                        className="px-3 py-2 bg-[#2a7c7c]/10 text-[#2a7c7c] text-xs font-bold rounded-lg hover:bg-[#2a7c7c]/20 transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Track
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Previously Owned Section ── */}
      {previousProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-teal-50/30">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-400 to-[#2a7c7c] flex items-center justify-center shadow-sm">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">Previously Owned</h2>
                <p className="text-xs text-gray-500">{previousProducts.length} product{previousProducts.length !== 1 ? "s" : ""} transferred</p>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {previousProducts.map((p, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-5 bg-gray-50/60 hover:bg-gray-50 transition-colors">
                <h3 className="font-semibold text-gray-700 mb-1">{p.productName}</h3>
                <p className="text-xs text-gray-400 mb-3">Owner: <span className="font-medium text-gray-500">{p.ownerEmail}</span></p>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-gray-300" />
                    <span className="text-[11px] text-gray-400 font-medium">View Only</span>
                  </div>
                  <button
                    onClick={() => setTrackModal(p)}
                    className="ml-auto px-3 py-1.5 bg-[#2a7c7c]/10 text-[#2a7c7c] text-[11px] font-bold rounded-lg hover:bg-[#2a7c7c]/20 transition flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {actionModal && <ActionModal product={actionModal.product} user={user} onComplete={handleActionComplete} onClose={() => setActionModal(null)} />}
      {receiptModal && <ReceiptModal receipt={receiptModal} onClose={() => setReceiptModal(null)} />}

      {/* Process-before-transfer warning */}
      {processWarning && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" onClick={() => setProcessWarning(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900">Product Not Processed</h3>
              <p className="text-sm text-gray-500 mt-2">
                <strong>{processWarning.product.productName}</strong> hasn't been processed yet (current stage: {processWarning.product.currentStage}).
                Are you sure you want to transfer it without processing?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setProcessWarning(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={() => {
                executeAction(processWarning.product, processWarning.result);
                setProcessWarning(null);
                setActionModal(null);
                setRefresh((r) => r + 1);
              }}
                className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-xl transition">
                Transfer Anyway
              </button>
            </div>
          </div>
        </div>
      )}
      {trackModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setTrackModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">{"\u{1F4CB}"} {trackModal.productName}</h3>
              <button onClick={() => setTrackModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6"><TrackingTimeline productId={trackModal.blockchainId} product={trackModal} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
