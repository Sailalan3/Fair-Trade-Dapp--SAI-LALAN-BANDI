import React from "react";
import { X, Download, Printer } from "lucide-react";
import { formatAddress } from "./AddressForm";
import { formatPhone } from "./PhoneInput";
import { downloadReceipt, printReceipt } from "../utils/receiptGenerator";

export default function ReceiptModal({ receipt, onClose }) {
  if (!receipt) return null;

  const handleDownload = () => downloadReceipt(receipt);
  const handlePrint = () => printReceipt(receipt);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#e6f3f3] to-[#dceeed]">
          <div>
            <h3 className="font-semibold text-gray-900">Receipt / Invoice</h3>
            <p className="text-xs text-gray-500">{receipt.receiptId}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Receipt Content */}
        <div className="p-6 space-y-4">
          {/* Product Details */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Product Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Product</span><span className="font-medium">{receipt.productName}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Product ID</span><span className="font-mono text-xs">{receipt.blockchainId || receipt.productId}</span></div>
              {receipt.category && <div className="flex justify-between"><span className="text-gray-600">Category</span><span className="capitalize">{receipt.category}</span></div>}
            </div>
          </div>

          {/* Transaction Details */}
          <div className="bg-[#e6f3f3] rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Transaction Details</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Action</span><span className="font-medium">{receipt.action}</span></div>
              <div className="flex justify-between">
                <span className="text-gray-600">From</span>
                <span className="font-medium">{receipt.from?.name} {receipt.from?.role ? `(${receipt.from.role})` : ""}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">To</span>
                <span className="font-medium">{receipt.to?.name} {receipt.to?.role ? `(${receipt.to.role})` : ""}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-green-50 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment</h4>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-sm">Amount</span>
              <span className="text-2xl font-bold text-green-700">${receipt.price || 0}</span>
            </div>
          </div>

          {/* Location */}
          {receipt.location && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Location</h4>
              <p className="text-sm text-gray-700">{formatAddress(receipt.location?.address || receipt.location)}</p>
              {receipt.location?.lat && (
                <p className="text-xs text-gray-500 mt-1">Coordinates: {receipt.location.lat.toFixed(4)}, {receipt.location.lng.toFixed(4)}</p>
              )}
            </div>
          )}

          {/* Contact */}
          {receipt.phone && (receipt.phone.number || typeof receipt.phone === "string") && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Contact</h4>
              <p className="text-sm text-gray-700">{formatPhone(receipt.phone)}</p>
            </div>
          )}

          {/* Blockchain */}
          {receipt.txHash && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Blockchain Info</h4>
              <p className="text-xs font-mono text-gray-600 break-all">{receipt.txHash}</p>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-center text-xs text-gray-400">
            {new Date(receipt.timestamp).toLocaleString()}
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 italic border-t border-gray-100 pt-3">
            This is a digitally generated receipt by FairTrace
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-medium text-sm rounded-xl transition">
            <Download className="w-4 h-4" /> Download PDF
          </button>
          <button onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-xl transition">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>
    </div>
  );
}
