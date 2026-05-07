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
import { Package, Eye, X, Truck, Globe, Lock, Anchor, Ship, MapPin, DollarSign, ArrowUpRight, BarChart3, Send, FileText, RefreshCw } from "lucide-react";

export default function ExporterPage() {
  const { user } = useAuth();
  const [category, setCategory] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [trackModal, setTrackModal] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [refresh, setRefresh] = useState(0);

  const role = user?.preferredRole || user?.role || "exporter";
  const myProducts = getMyProducts(user?.email).filter((p) => p.status !== "closed" && (!category || p.category === category));
  const previousProducts = getPreviousOwnerProducts(user?.email).filter((p) => !category || p.category === category);

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

  /* ---------- derived stats ---------- */
  const totalValue = myProducts.reduce((s, p) => s + (p.currentPrice || p.initialPrice || 0), 0);
  const exportedCount = myProducts.filter((p) => p.currentStage === "Exported").length;
  const inTransitCount = myProducts.filter((p) => ["Shipped", "In Transit", "At Port"].includes(p.currentStage)).length;
  const allProducts = [...myProducts, ...previousProducts];
  const internationalCount = allProducts.length;
  const domesticCount = myProducts.filter((p) => p.currentStage === "Received" || p.currentStage === "Stored").length;
  const intlPercent = allProducts.length > 0 ? Math.round((exportedCount + previousProducts.length) / Math.max(allProducts.length, 1) * 100) : 0;
  const domesticPercent = 100 - intlPercent;
  const uniqueDestinations = new Set(previousProducts.map((p) => p.ownerEmail)).size || 0;
  const shipmentProgress = myProducts.length > 0 ? Math.round((exportedCount / myProducts.length) * 100) : 0;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ---- Video Hero Banner ---- */}
      <VideoHero
        page="exporter"
        innerPage
        title={<>{"\u{1F6A2}"} {user?.fullName} <span className="capitalize">({role})</span></>}
        subtitle="Manage global exports, shipping, and international trade"
      />

      {/* ---- Incoming Products ---- */}
      <IncomingProducts userEmail={user?.email} onUpdate={() => setRefresh((r) => r + 1)} />

      {/* ---- Category Filter ---- */}
      <CategoryNav selected={category} onSelect={setCategory} />

      {/* ---- Large Highlight Stat Card ---- */}
      <div className="rounded-2xl p-6 shadow-lg relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0e7490 0%, #2a7c7c 40%, #155e75 100%)" }}>
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10 bg-white" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Ship className="w-5 h-5 text-white" />
              </div>
              <p className="text-cyan-100 text-sm font-medium">Total Export Value</p>
            </div>
            <p className="text-4xl font-extrabold text-white tracking-tight">${totalValue.toLocaleString()}</p>
            <p className="text-cyan-200 text-xs mt-1">
              Across {myProducts.length} active shipment{myProducts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-3 py-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-emerald-200 text-xs font-semibold">{shipmentProgress}% exported</span>
            </div>
            <p className="text-cyan-200 text-[11px]">{exportedCount} of {myProducts.length} shipments completed</p>
          </div>
        </div>
      </div>

      {/* ---- Stats Grid with Progress Bars ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Shipments */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Anchor className="w-5 h-5 text-cyan-700" />
            </div>
            <span className="text-[10px] font-semibold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full">ACTIVE</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{myProducts.length}</p>
          <p className="text-xs text-gray-500 mb-2">Total Shipments</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(shipmentProgress, 100)}%`, background: "linear-gradient(90deg, #0e7490, #2a7c7c)" }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{shipmentProgress}% completion rate</p>
        </div>

        {/* Export Value */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5 text-teal-700" />
            </div>
            <span className="text-[10px] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">VALUE</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">${totalValue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mb-2">Export Revenue</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-teal-500 transition-all duration-500"
              style={{ width: `${totalValue > 0 ? 100 : 0}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Avg ${myProducts.length > 0 ? Math.round(totalValue / myProducts.length) : 0} per shipment</p>
        </div>

        {/* International / Domestic Split */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Globe className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">SPLIT</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{intlPercent}%</p>
          <p className="text-xs text-gray-500 mb-2">International Rate</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5 flex overflow-hidden">
            <div className="h-1.5 bg-blue-500 transition-all duration-500"
              style={{ width: `${intlPercent}%` }} />
            <div className="h-1.5 bg-cyan-300 transition-all duration-500"
              style={{ width: `${domesticPercent}%` }} />
          </div>
          <div className="flex justify-between mt-1">
            <p className="text-[10px] text-blue-500">Intl {intlPercent}%</p>
            <p className="text-[10px] text-cyan-500">Dom {domesticPercent}%</p>
          </div>
        </div>

        {/* Destinations */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <MapPin className="w-5 h-5 text-indigo-600" />
            </div>
            <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">REACH</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{uniqueDestinations}</p>
          <p className="text-xs text-gray-500 mb-2">Destinations</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-indigo-400 transition-all duration-500"
              style={{ width: `${Math.min(uniqueDestinations * 20, 100)}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{previousProducts.length} transfers completed</p>
        </div>
      </div>

      {/* ---- Quick Action Buttons ---- */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "New Shipment", icon: Send, bg: "bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white shadow-md shadow-cyan-200/40" },
          { label: "Export Report", icon: FileText, bg: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm" },
          { label: "Track All", icon: BarChart3, bg: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm" },
          { label: "Refresh Data", icon: RefreshCw, bg: "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm", action: () => setRefresh((r) => r + 1) },
        ].map((btn) => (
          <button key={btn.label} onClick={btn.action || undefined}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${btn.bg}`}>
            <btn.icon className="w-4 h-4" />
            {btn.label}
          </button>
        ))}
      </div>

      {/* ---- My Products / Shipments ---- */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between"
          style={{ background: "linear-gradient(90deg, rgba(14,116,144,0.04) 0%, rgba(42,124,124,0.02) 100%)" }}>
          <div>
            <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
              <Ship className="w-5 h-5 text-cyan-700" /> Active Shipments
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Acting as <strong className="capitalize text-cyan-700">{role}</strong> &middot; {myProducts.length} product{myProducts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" /> Live
          </div>
        </div>
        {myProducts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-50 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-cyan-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No active shipments</p>
            <p className="text-xs text-gray-300 mt-1">Products you own will appear here</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {myProducts.map((p, i) => {
              const isOwner = canUserActOnProduct(user?.email, p);
              const catInfo = CATEGORIES.find((c) => c.id === p.category);
              return (
                <div key={i}
                  className="group border border-gray-100 rounded-xl p-4 hover:shadow-lg hover:border-cyan-200 transition-all duration-200 relative overflow-hidden">
                  {/* subtle accent bar */}
                  <div className="absolute top-0 left-0 w-full h-0.5"
                    style={{ background: "linear-gradient(90deg, #0e7490, #2a7c7c, #06b6d4)" }} />
                  <div className="flex items-start justify-between mb-3 mt-1">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-cyan-800 transition-colors">{p.productName}</h3>
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <Package className="w-3 h-3" /> {p.batchId}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {catInfo && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">{catInfo.emoji}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STAGE_COLORS[p.currentStage] || "bg-gray-100"}`}>
                        {STAGE_EMOJIS[p.currentStage] || ""} {p.currentStage}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-lg font-bold" style={{ color: "#0e7490" }}>
                      ${p.currentPrice || p.initialPrice}
                    </p>
                    {p.destination && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                        <MapPin className="w-3 h-3" /> {p.destination}
                      </span>
                    )}
                  </div>
                  {isOwner && (
                    <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-50">
                      <button onClick={() => setActionModal({ product: p })}
                        className="flex-1 px-3 py-2 text-white text-[12px] font-semibold rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                        style={{ background: "linear-gradient(135deg, #0e7490, #2a7c7c)" }}>
                        <Truck className="w-3.5 h-3.5 inline mr-1" /> Proceed
                      </button>
                      <button onClick={() => setTrackModal(p)}
                        className="px-3 py-2 bg-cyan-50 text-cyan-700 text-[12px] font-semibold rounded-lg hover:bg-cyan-100 transition-all duration-200">
                        <Eye className="w-3.5 h-3.5 inline mr-1" /> Track
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Previously Owned ---- */}
      {previousProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
            <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" /> Previously Exported
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{previousProducts.length} product{previousProducts.length !== 1 ? "s" : ""} transferred to other parties</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {previousProducts.map((p, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gradient-to-br from-slate-50/80 to-white hover:shadow-md transition-all duration-200">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-700">{p.productName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STAGE_COLORS[p.currentStage] || "bg-gray-100"}`}>
                    {STAGE_EMOJIS[p.currentStage] || ""} {p.currentStage}
                  </span>
                </div>
                <div className="space-y-1 mb-3">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <Ship className="w-3 h-3 text-gray-400" /> Exported by: {user?.fullName}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-gray-400" /> Current: {p.ownerEmail}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 pt-3 border-t border-gray-100">
                  <Lock className="w-3 h-3 text-gray-300" />
                  <span className="text-[11px] text-gray-400">View Only</span>
                  <button onClick={() => setTrackModal(p)}
                    className="ml-auto px-3 py-1.5 bg-cyan-50 text-cyan-700 text-[11px] font-semibold rounded-lg hover:bg-cyan-100 transition">
                    <Eye className="w-3 h-3 inline mr-0.5" /> Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Modals (unchanged logic) ---- */}
      {actionModal && <ActionModal product={actionModal.product} user={user} onComplete={handleActionComplete} onClose={() => setActionModal(null)} />}
      {receiptModal && <ReceiptModal receipt={receiptModal} onClose={() => setReceiptModal(null)} />}
      {trackModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTrackModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto border border-gray-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
              style={{ background: "linear-gradient(90deg, rgba(14,116,144,0.06) 0%, rgba(42,124,124,0.02) 100%)" }}>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Ship className="w-4 h-4 text-cyan-700" /> {trackModal.productName}
              </h3>
              <button onClick={() => setTrackModal(null)} className="p-1 rounded-lg hover:bg-gray-100 transition">
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
