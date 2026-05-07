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
import { Package, Eye, X, ShoppingCart, DollarSign, Lock, TrendingUp, FileText } from "lucide-react";
import { downloadReceipt } from "../utils/receiptGenerator";

export default function RetailerPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [trackModal, setTrackModal] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const role = user?.preferredRole || user?.role || "retailer";
  const myProducts = getMyProducts(user?.email).filter((p) => p.status !== "closed" && (!category || p.category === category));
  const previousProducts = getPreviousOwnerProducts(user?.email).filter((p) => !category || p.category === category);
  const soldProducts = getMyProducts(user?.email).filter((p) => p.status === "closed" && (!category || p.category === category));

  const handleActionComplete = (result) => {
    const p = actionModal.product;
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

  const revenue = soldProducts.reduce((s, p) => s + (p.currentPrice || 0), 0);
  const totalCustomers = soldProducts.length;
  const inventoryCapacity = myProducts.length > 0 ? Math.min(100, Math.round((myProducts.length / (myProducts.length + soldProducts.length + 1)) * 100)) : 0;
  const salesRate = soldProducts.length + myProducts.length > 0 ? Math.round((soldProducts.length / (soldProducts.length + myProducts.length)) * 100) : 0;

  return (
    <div className="w-full pb-12">
      {/* --- Video Hero Banner --- */}
      <VideoHero
        page="retailer"
        innerPage
        title={<>{"\u{1F3EC}"} {user?.fullName} <span className="capitalize">({role})</span></>}
        subtitle="Retail, sell products, and manage your storefront"
      />

      {/* --- Incoming Products --- */}
      <div className="mt-6">
        <IncomingProducts userEmail={user?.email} onUpdate={() => setRefresh((r) => r + 1)} />
      </div>

      {/* --- Category Navigation --- */}
      <div className="mt-6">
        <CategoryNav selected={category} onSelect={setCategory} />
      </div>

      {/* --- Large Highlight Stat Card --- */}
      <div className="mt-6 rounded-2xl p-6 md:p-8"
        style={{ background: "linear-gradient(135deg, #2a7c7c 0%, #6b46c1 50%, #7c3aed 100%)" }}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium tracking-wide uppercase">Total Revenue</p>
            <p className="text-4xl md:text-5xl font-extrabold text-white mt-1">${revenue.toLocaleString()}</p>
            <p className="text-white/60 text-sm mt-2">
              From {soldProducts.length} completed sale{soldProducts.length !== 1 ? "s" : ""} &middot; {myProducts.length} item{myProducts.length !== 1 ? "s" : ""} in store
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div className="hidden md:block text-right">
              <p className="text-white text-2xl font-bold">{totalCustomers}</p>
              <p className="text-white/60 text-xs">Customers Served</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Grid of Stat Cards with Progress Bars --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[
          {
            label: "Store Inventory",
            value: myProducts.length,
            icon: Package,
            progress: inventoryCapacity,
            progressColor: "bg-purple-500",
            iconBg: "bg-purple-100",
            iconColor: "text-purple-600",
            sub: `${inventoryCapacity}% capacity`,
          },
          {
            label: "Total Sales",
            value: soldProducts.length,
            icon: ShoppingCart,
            progress: salesRate,
            progressColor: "bg-emerald-500",
            iconBg: "bg-emerald-100",
            iconColor: "text-emerald-600",
            sub: `${salesRate}% sell-through`,
          },
          {
            label: "Revenue",
            value: "$" + revenue.toLocaleString(),
            icon: DollarSign,
            progress: Math.min(100, revenue > 0 ? 65 : 0),
            progressColor: "bg-violet-500",
            iconBg: "bg-violet-100",
            iconColor: "text-violet-600",
            sub: "Lifetime earnings",
          },
          {
            label: "Customers Served",
            value: totalCustomers,
            icon: TrendingUp,
            progress: Math.min(100, totalCustomers * 10),
            progressColor: "bg-[#2a7c7c]",
            iconBg: "bg-[#d1eaea]",
            iconColor: "text-[#2a7c7c]",
            sub: `${previousProducts.length} transferred`,
          },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                <s.icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
            {/* Progress bar */}
            <div className="mt-3">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${s.progressColor}`}
                  style={{ width: `${s.progress}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* --- Quick Action Buttons Row --- */}
      <div className="mt-6 flex flex-wrap gap-3">
        {[
          { label: "View All Inventory", icon: Package, onClick: () => setCategory(null), style: "bg-purple-600 hover:bg-purple-700 text-white" },
          { label: "Sales History", icon: ShoppingCart, onClick: () => {}, style: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
          { label: "Track Product", icon: Eye, onClick: () => { if (myProducts[0]) setTrackModal(myProducts[0]); }, style: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200" },
          { label: "Revenue Report", icon: FileText, onClick: () => {}, style: "bg-gradient-to-r from-[#2a7c7c] to-purple-600 hover:opacity-90 text-white" },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.onClick}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${btn.style}`}
          >
            <btn.icon className="w-4 h-4" />
            {btn.label}
          </button>
        ))}
      </div>

      {/* --- My Products (Improved Card Design) --- */}
      <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Package className="w-4 h-4 text-purple-600" />
              </div>
              My Products
            </h2>
            <p className="text-xs text-gray-500 mt-1 ml-10">
              Acting as <strong className="capitalize text-purple-600">{role}</strong> &middot; {myProducts.length} item{myProducts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <span className="text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            {myProducts.length} Active
          </span>
        </div>
        {myProducts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm text-gray-400">No products in your inventory</p>
            <p className="text-xs text-gray-300 mt-1">Products assigned to you will appear here</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {myProducts.map((p, i) => {
              const isOwner = canUserActOnProduct(user?.email, p);
              const catInfo = CATEGORIES.find((c) => c.id === p.category);
              return (
                <div key={i} className="group relative border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:border-purple-200 transition-all duration-200 bg-gradient-to-br from-white to-purple-50/30">
                  {/* Top row: badges */}
                  <div className="flex items-center gap-1.5 mb-3">
                    {catInfo && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">
                        {catInfo.emoji} {catInfo.label}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STAGE_COLORS[p.currentStage] || "bg-gray-100"}`}>
                      {STAGE_EMOJIS[p.currentStage] || ""} {p.currentStage}
                    </span>
                  </div>
                  {/* Product name */}
                  <h3 className="font-semibold text-gray-900 text-base">{p.productName}</h3>
                  <p className="text-xs text-gray-400 mt-0.5 font-mono">{p.batchId}</p>
                  {/* Price */}
                  <div className="mt-3 flex items-end gap-1">
                    <span className="text-xl font-bold text-purple-600">${p.currentPrice || p.initialPrice}</span>
                    {p.initialPrice && p.currentPrice && p.currentPrice !== p.initialPrice && (
                      <span className="text-xs text-gray-400 line-through mb-0.5">${p.initialPrice}</span>
                    )}
                  </div>
                  {/* Action buttons */}
                  {isOwner && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => setActionModal({ product: p })}
                        className="flex-1 min-w-0 px-4 py-2 bg-gradient-to-r from-[#2a7c7c] to-purple-600 hover:from-[#1d5c5c] hover:to-purple-700 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow"
                      >
                        Proceed
                      </button>
                      <button
                        onClick={() => setTrackModal(p)}
                        className="px-3 py-2 bg-purple-50 text-purple-700 text-xs font-semibold rounded-xl hover:bg-purple-100 transition-all duration-200 flex items-center gap-1"
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

      {/* --- Sold Products --- */}
      {soldProducts.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Sold Products</h2>
                <p className="text-xs text-gray-400">{soldProducts.length} completed sale{soldProducts.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              ${revenue.toLocaleString()} total
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {soldProducts.map((p, i) => (
              <div key={i} className="border border-emerald-100 rounded-2xl p-5 bg-gradient-to-br from-emerald-50/40 to-white hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wide">Sold</span>
                </div>
                <h3 className="font-semibold text-gray-900">{p.productName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Sold to: {p.soldTo || "Consumer"}</p>
                <p className="text-lg font-bold text-emerald-600 mt-2">${p.currentPrice || p.initialPrice}</p>
                <div className="flex gap-2 mt-4 pt-3 border-t border-emerald-100">
                  <button
                    onClick={() => setTrackModal(p)}
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 text-[11px] font-semibold rounded-xl hover:bg-purple-100 transition flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> Track
                  </button>
                  {p.receiptId && (
                    <button
                      onClick={() => downloadReceipt({ receiptId: p.receiptId, productName: p.productName, price: p.currentPrice })}
                      className="px-3 py-1.5 bg-[#e6f3f3] text-[#2a7c7c] text-[11px] font-semibold rounded-xl hover:bg-[#d1eaea] transition flex items-center gap-1"
                    >
                      <FileText className="w-3 h-3" /> Receipt
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Previously Owned --- */}
      {previousProducts.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <Lock className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Previously Owned</h2>
                <p className="text-xs text-gray-400">{previousProducts.length} product{previousProducts.length !== 1 ? "s" : ""} transferred</p>
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {previousProducts.map((p, i) => (
              <div key={i} className="border border-gray-100 rounded-2xl p-5 bg-gradient-to-br from-gray-50/50 to-white hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">View Only</span>
                </div>
                <h3 className="font-semibold text-gray-700">{p.productName}</h3>
                <p className="text-xs text-gray-500 mt-0.5">Current owner: {p.ownerEmail}</p>
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                  <button
                    onClick={() => setTrackModal(p)}
                    className="px-3 py-1.5 bg-purple-50 text-purple-700 text-[11px] font-semibold rounded-xl hover:bg-purple-100 transition flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" /> Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Modals (unchanged logic) --- */}
      {actionModal && <ActionModal product={actionModal.product} user={user} onComplete={handleActionComplete} onClose={() => setActionModal(null)} />}
      {receiptModal && <ReceiptModal receipt={receiptModal} onClose={() => setReceiptModal(null)} />}
      {trackModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTrackModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto border border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-[#e6f3f3]">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" />
                {trackModal.productName}
              </h3>
              <button onClick={() => setTrackModal(null)} className="w-8 h-8 rounded-lg hover:bg-white/60 flex items-center justify-center transition">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6"><TrackingTimeline productId={trackModal.blockchainId} product={trackModal} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
