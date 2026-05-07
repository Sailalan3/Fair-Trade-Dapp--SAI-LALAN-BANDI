import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getMyProducts, getDeliveries, getDeliveryByProduct, updateDeliveryStatus, addDelivery,
  canUserActOnProduct, selfActionOnProduct, transferProduct, closeProduct,
  DELIVERY_STATUSES, STAGE_COLORS, STAGE_EMOJIS,
} from "../utils/store";
import DeliveryStatusTracker from "../components/DeliveryStatusTracker";
import ActionModal from "../components/ActionModal";
import ReceiptModal from "../components/ReceiptModal";
import AddressForm, { formatAddress } from "../components/AddressForm";
import PhoneInput from "../components/PhoneInput";
import GoogleMapPicker from "../components/GoogleMapPicker";
import TrackingTimeline from "../components/TrackingTimeline";
import VideoHero from "../components/VideoHero";
import IncomingProducts from "../components/IncomingProducts";
import {
  Truck, Package, Eye, X, MapPin, CheckCircle, Route,
  ArrowRight, BarChart3, Clock, ChevronRight, Activity,
  Send, DollarSign, ShoppingBag, Zap,
} from "lucide-react";
import { predictDeliveryTime } from "../utils/aiEngine";

export default function TransporterPage() {
  const { user } = useAuth();
  const [trackModal, setTrackModal] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [updateModal, setUpdateModal] = useState(null);
  const [address, setAddress] = useState({ line1: "", line2: "", country: "", state: "", city: "", postalCode: "" });
  const [phone, setPhone] = useState({ countryCode: "+44", number: "" });
  const [location, setLocation] = useState({ lat: null, lng: null });
  const [updateStep, setUpdateStep] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [deliveryModal, setDeliveryModal] = useState(null);
  const [deliveryForm, setDeliveryForm] = useState({ receiverEmail: "", receiverError: "" });
  const [deliveryAddress, setDeliveryAddress] = useState({ line1: "", line2: "", country: "", state: "", city: "", postalCode: "" });
  const [deliveryPhone, setDeliveryPhone] = useState({ countryCode: "+44", number: "" });
  const [deliveryLocation, setDeliveryLocation] = useState({ lat: null, lng: null });
  const [deliveryStep, setDeliveryStep] = useState(0);

  const role = user?.preferredRole || user?.role || "transporter";
  const myProducts = getMyProducts(user?.email).filter((p) => p.status !== "closed");
  const myDeliveries = getDeliveries(user?.email);
  const activeDeliveries = myDeliveries.filter((d) => d.status !== "Delivered" && d.transporterEmail === user?.email);
  const completedDeliveries = myDeliveries.filter((d) => d.status === "Delivered" && d.transporterEmail === user?.email);

  const totalDeliveries = activeDeliveries.length + completedDeliveries.length;
  const completionRate = totalDeliveries > 0 ? Math.round((completedDeliveries.length / totalDeliveries) * 100) : 0;
  const distanceCovered = completedDeliveries.length * 142 + activeDeliveries.length * 67;

  const handleStartStatusUpdate = (delivery, nextStatus) => {
    setUpdateModal({ delivery, nextStatus });
    setAddress({ line1: "", line2: "", country: "", state: "", city: "", postalCode: "" });
    setPhone({ countryCode: "+44", number: "" });
    setLocation({ lat: null, lng: null });
    setUpdateStep(0);
  };

  const handleConfirmStatusUpdate = () => {
    updateDeliveryStatus(updateModal.delivery.deliveryId, updateModal.nextStatus, { address, lat: location.lat, lng: location.lng }, phone);
    setUpdateModal(null);
    setRefresh((r) => r + 1);
  };

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

  const handleStartDelivery = (product) => {
    setDeliveryModal(product);
    setDeliveryForm({ receiverEmail: "", receiverError: "" });
    setDeliveryAddress({ line1: "", line2: "", country: "", state: "", city: "", postalCode: "" });
    setDeliveryPhone({ countryCode: "+44", number: "" });
    setDeliveryLocation({ lat: null, lng: null });
    setDeliveryStep(0);
  };

  const handleConfirmDelivery = () => {
    const product = deliveryModal;
    addDelivery({
      productId: product.blockchainId,
      productName: product.productName,
      transporterEmail: user?.email,
      transporterName: user?.fullName,
      receiverEmail: deliveryForm.receiverEmail,
      location: { address: deliveryAddress, lat: deliveryLocation.lat, lng: deliveryLocation.lng },
      phone: deliveryPhone,
    });
    setDeliveryModal(null);
    setRefresh((r) => r + 1);
  };

  const isDeliveryAddressValid = deliveryAddress.line1 && deliveryAddress.country && deliveryAddress.city;
  const isAddressValid = address.line1 && address.country && address.city;

  /* --- stat card data --- */
  const stats = [
    {
      label: "Active Deliveries",
      value: activeDeliveries.length,
      icon: Truck,
      progress: totalDeliveries > 0 ? Math.round((activeDeliveries.length / totalDeliveries) * 100) : 0,
      progressColor: "bg-indigo-500",
      bg: "bg-indigo-50",
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
    },
    {
      label: "Products in Transit",
      value: myProducts.length,
      icon: Package,
      progress: myProducts.length > 0 ? 100 : 0,
      progressColor: "bg-[#2a7c7c]",
      bg: "bg-teal-50",
      iconBg: "bg-[#d1eaea]",
      iconColor: "text-[#2a7c7c]",
    },
    {
      label: "Completed Deliveries",
      value: completedDeliveries.length,
      icon: CheckCircle,
      progress: completionRate,
      progressColor: "bg-emerald-500",
      bg: "bg-emerald-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      label: "Distance Covered",
      value: `${distanceCovered} km`,
      icon: Route,
      progress: Math.min(100, Math.round(distanceCovered / 20)),
      progressColor: "bg-slate-500",
      bg: "bg-slate-50",
      iconBg: "bg-slate-100",
      iconColor: "text-slate-600",
    },
  ];

  return (
    <div className="w-full pb-16">
      {/* ---- Hero ---- */}
      <VideoHero
        page="transporter"
        innerPage
        title={<><span className="mr-2">&#128666;</span>{user?.fullName} <span className="capitalize font-normal opacity-80">({role})</span></>}
        subtitle="Track and manage deliveries step-by-step across the supply chain"
      />

      {/* ---- Incoming Products ---- */}
      <div className="mt-6">
        <IncomingProducts userEmail={user?.email} onUpdate={() => setRefresh((r) => r + 1)} />
      </div>

      <div className="space-y-8 mt-8">

        {/* ---- Highlight Card ---- */}
        <div className="rounded-2xl overflow-hidden shadow-lg"
          style={{ background: "linear-gradient(135deg, #312e81 0%, #1e293b 50%, #134e4a 100%)" }}>
          <div className="px-7 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-1">
              <p className="text-indigo-200 text-sm font-medium tracking-wide uppercase">Fleet Overview</p>
              <p className="text-white text-4xl font-extrabold tracking-tight">
                {activeDeliveries.length}
                <span className="text-lg font-medium text-indigo-200 ml-2">active</span>
              </p>
              <p className="text-slate-300 text-sm mt-1">
                {completedDeliveries.length} completed &middot; {myProducts.length} products in possession &middot; {distanceCovered} km covered
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-400/30 flex items-center justify-center relative">
                <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#818cf8" strokeWidth="6"
                    strokeDasharray={`${completionRate * 2.136} 999`} strokeLinecap="round" />
                </svg>
                <span className="text-white text-lg font-bold">{completionRate}%</span>
              </div>
              <div className="text-sm">
                <p className="text-indigo-200 font-medium">Completion</p>
                <p className="text-slate-400 text-xs">Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Stat Cards Grid ---- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-5 border border-white/60 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                  <s.icon className={`w-5 h-5 ${s.iconColor}`} />
                </div>
                <Activity className="w-4 h-4 text-gray-300" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 mb-3">{s.label}</p>
              <div className="w-full h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${s.progressColor} transition-all duration-700`}
                  style={{ width: `${s.progress}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* ---- Quick Actions ---- */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: "View All Deliveries", icon: Truck, scroll: "active" },
            { label: "Products in Possession", icon: Package, scroll: "products" },
            { label: "Completed History", icon: BarChart3, scroll: "completed" },
          ].map((action) => (
            <button key={action.label}
              onClick={() => document.getElementById(action.scroll)?.scrollIntoView({ behavior: "smooth" })}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                         bg-white border border-gray-200 text-gray-700 shadow-sm
                         hover:border-indigo-300 hover:text-indigo-700 hover:shadow-md transition-all">
              <action.icon className="w-4 h-4" />
              {action.label}
              <ChevronRight className="w-3.5 h-3.5 opacity-40" />
            </button>
          ))}
        </div>

        {/* ---- Active Deliveries ---- */}
        <div id="active" className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50/80 to-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Active Deliveries</h2>
                <p className="text-xs text-gray-500">{activeDeliveries.length} in progress</p>
              </div>
            </div>
            {activeDeliveries.length > 0 && (
              <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                {activeDeliveries.length}
              </span>
            )}
          </div>

          {activeDeliveries.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Truck className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">No active deliveries right now</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {activeDeliveries.map((d, i) => {
                const currentIdx = DELIVERY_STATUSES.indexOf(d.status);
                const nextStatus = currentIdx < DELIVERY_STATUSES.length - 1 ? DELIVERY_STATUSES[currentIdx + 1] : null;
                const progressPct = Math.round(((currentIdx + 1) / DELIVERY_STATUSES.length) * 100);

                return (
                  <div key={i} className="p-6 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-slate-100 flex items-center justify-center mt-0.5">
                          <Package className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{d.productName || `Product #${d.productId}`}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">To: {d.receiverEmail}</p>
                          <p className="text-[11px] text-gray-400 font-mono">{d.deliveryId}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide ${STAGE_COLORS[d.status] || "bg-gray-100 text-gray-600"}`}>
                        {STAGE_EMOJIS[d.status] || ""} {d.status}
                      </span>
                    </div>

                    {/* mini progress */}
                    <div className="ml-13 mt-3 mb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-[#2a7c7c] transition-all duration-500"
                            style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium w-8 text-right">{progressPct}%</span>
                      </div>
                    </div>

                    {/* AI Delivery Prediction */}
                    {(() => {
                      const prediction = predictDeliveryTime(d.productId);
                      if (!prediction) return null;
                      return (
                        <div className="ml-13 mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100">
                          <Zap className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-indigo-700">AI Prediction: </span>
                            <span className="text-xs text-indigo-600">
                              Est. {prediction.estimatedHours != null ? `${prediction.estimatedHours}h remaining` : prediction.estimatedTime || "calculating..."}
                            </span>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            prediction.confidence === "high" ? "bg-green-100 text-green-700" :
                            prediction.confidence === "medium" ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>{prediction.confidence || "low"}</span>
                        </div>
                      );
                    })()}

                    <DeliveryStatusTracker
                      currentStatus={d.status}
                      statusHistory={d.statusHistory}
                      isOwner={true}
                      onUpdateStatus={(status) => handleStartStatusUpdate(d, status)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ---- Products in Possession ---- */}
        {myProducts.length > 0 && (
          <div id="products" className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-teal-50/80 to-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#d1eaea] flex items-center justify-center">
                  <Package className="w-5 h-5 text-[#2a7c7c]" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Products in Possession</h2>
                  <p className="text-xs text-gray-500">{myProducts.length} product{myProducts.length !== 1 ? "s" : ""} currently held</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-[#d1eaea] text-[#2a7c7c] text-xs font-semibold rounded-full">
                {myProducts.length}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
              {myProducts.map((p, i) => (
                <div key={i}
                  className="group rounded-xl border border-gray-100 p-5 hover:border-[#2a7c7c]/30 hover:shadow-md transition-all bg-gradient-to-br from-white to-teal-50/30">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-lg bg-[#d1eaea] flex items-center justify-center">
                      <Package className="w-4 h-4 text-[#2a7c7c]" />
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STAGE_COLORS[p.currentStage] || "bg-gray-100 text-gray-600"}`}>
                      {p.currentStage}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{p.productName}</h3>
                  <p className="text-xs text-gray-400 mb-3">${p.currentPrice || p.initialPrice || 0}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(() => {
                      const existingDelivery = getDeliveryByProduct(p.blockchainId);
                      const hasActiveDelivery = existingDelivery && existingDelivery.status !== "Delivered";
                      if (hasActiveDelivery) {
                        return (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 text-indigo-700 text-[11px] font-semibold rounded-lg">
                            <Truck className="w-3 h-3" /> Delivery In Progress
                          </span>
                        );
                      }
                      return (
                        <button onClick={() => handleStartDelivery(p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2a7c7c] text-white text-[11px] font-semibold rounded-lg
                                     hover:bg-[#1d5c5c] transition shadow-sm">
                          <Send className="w-3 h-3" /> Start Delivery
                        </button>
                      );
                    })()}
                    <button onClick={() => setTrackModal(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[11px] font-medium rounded-lg
                                 hover:bg-indigo-100 transition">
                      <Eye className="w-3.5 h-3.5" /> Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- Completed Deliveries ---- */}
        {completedDeliveries.length > 0 && (
          <div id="completed" className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden bg-white">
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50/80 to-slate-50/60 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Completed Deliveries</h2>
                  <p className="text-xs text-gray-500">{completedDeliveries.length} successfully delivered</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">
                {completedDeliveries.length}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 p-6">
              {completedDeliveries.map((d, i) => (
                <div key={i}
                  className="rounded-xl border border-emerald-100 p-5 bg-gradient-to-br from-white to-emerald-50/40
                             hover:shadow-md hover:border-emerald-200 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{d.productName || `Product #${d.productId}`}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Delivered to: {d.receiverEmail}</p>
                      <div className="flex items-center gap-1.5 mt-2 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        {new Date(d.completedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ---- Delivery Status Update Modal ---- */}
      {updateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setUpdateModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100"
              style={{ background: "linear-gradient(135deg, #eef2ff 0%, #e0f2f1 100%)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Update: {updateModal.nextStatus}</h3>
                  <p className="text-xs text-gray-500 font-mono">{updateModal.delivery.deliveryId}</p>
                </div>
              </div>
              <button onClick={() => setUpdateModal(null)}
                className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {updateStep === 0 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-indigo-500" />
                    <p className="text-sm font-medium text-gray-700">Enter current location</p>
                  </div>
                  <AddressForm address={address} onChange={setAddress} />
                  <PhoneInput phone={phone} onChange={setPhone} />
                  <button onClick={() => setUpdateStep(1)} disabled={!isAddressValid}
                    className="w-full px-4 py-3 text-white text-sm font-semibold rounded-xl transition disabled:opacity-40
                               shadow-lg shadow-indigo-200/50 hover:shadow-indigo-300/50"
                    style={{ background: "linear-gradient(135deg, #4338ca 0%, #2a7c7c 100%)" }}>
                    Next: Confirm on Map
                    <ArrowRight className="w-4 h-4 inline ml-2" />
                  </button>
                </div>
              )}
              {updateStep === 1 && (
                <GoogleMapPicker address={address} location={location}
                  onConfirm={(loc) => { setLocation(loc); handleConfirmStatusUpdate(); }}
                  onBack={() => setUpdateStep(0)}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- Action Modal ---- */}
      {actionModal && (
        <ActionModal product={actionModal.product} user={user} defaultFlow={actionModal.defaultFlow}
          onComplete={handleActionComplete} onClose={() => setActionModal(null)} />
      )}

      {/* ---- Receipt Modal ---- */}
      {receiptModal && (
        <ReceiptModal receipt={receiptModal} onClose={() => setReceiptModal(null)} />
      )}

      {/* ---- Start Delivery Modal ---- */}
      {deliveryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeliveryModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100"
              style={{ background: "linear-gradient(135deg, #eef2ff 0%, #e0f2f1 100%)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#d1eaea] flex items-center justify-center">
                  <Truck className="w-5 h-5 text-[#2a7c7c]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Start Delivery</h3>
                  <p className="text-xs text-gray-500">{deliveryModal.productName}</p>
                </div>
              </div>
              <button onClick={() => setDeliveryModal(null)}
                className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6">
              {deliveryStep === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Receiver Email *</label>
                    <input type="email" value={deliveryForm.receiverEmail}
                      onChange={(e) => setDeliveryForm({ ...deliveryForm, receiverEmail: e.target.value, receiverError: "" })}
                      placeholder="receiver@example.com"
                      className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/20 ${deliveryForm.receiverError ? "border-red-400" : "border-gray-200"}`} />
                    {deliveryForm.receiverError && <p className="text-xs text-red-500 mt-1">{deliveryForm.receiverError}</p>}
                  </div>
                  <p className="text-xs font-medium text-gray-600">Pickup / Current Location</p>
                  <AddressForm address={deliveryAddress} onChange={setDeliveryAddress} />
                  <PhoneInput phone={deliveryPhone} onChange={setDeliveryPhone} />
                  <button onClick={() => {
                    if (!deliveryForm.receiverEmail) {
                      setDeliveryForm({ ...deliveryForm, receiverError: "Please enter receiver email" });
                      return;
                    }
                    if (deliveryForm.receiverEmail === user?.email) {
                      setDeliveryForm({ ...deliveryForm, receiverError: "Cannot deliver to yourself" });
                      return;
                    }
                    setDeliveryStep(1);
                  }}
                    disabled={!deliveryForm.receiverEmail || !isDeliveryAddressValid}
                    className="w-full px-4 py-3 text-white text-sm font-semibold rounded-xl transition disabled:opacity-40 shadow-lg"
                    style={{ background: "linear-gradient(135deg, #4338ca 0%, #2a7c7c 100%)" }}>
                    Next: Confirm on Map <ArrowRight className="w-4 h-4 inline ml-2" />
                  </button>
                </div>
              )}
              {deliveryStep === 1 && (
                <GoogleMapPicker address={deliveryAddress} location={deliveryLocation}
                  onConfirm={(loc) => { setDeliveryLocation(loc); setDeliveryStep(2); }}
                  onBack={() => setDeliveryStep(0)}
                />
              )}
              {deliveryStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700">Confirm delivery details:</p>
                  <div className="bg-[#e6f3f3] border border-[#c5dfdf] rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Product</span><span className="font-medium">{deliveryModal.productName}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Deliver To</span><span className="font-medium">{deliveryForm.receiverEmail}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Pickup Location</span><span className="font-medium text-right max-w-[200px] truncate">{[deliveryAddress.line1, deliveryAddress.city, deliveryAddress.country].filter(Boolean).join(", ")}</span></div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setDeliveryStep(1)} className="px-4 py-2.5 text-sm text-gray-600 hover:text-gray-800">{"\u2190"} Back</button>
                    <button onClick={handleConfirmDelivery}
                      className="flex-1 px-4 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-xl transition shadow-sm">
                      {"\u{1F69A}"} Dispatch Delivery
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- Track Modal ---- */}
      {trackModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setTrackModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-teal-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#d1eaea] flex items-center justify-center">
                  <Eye className="w-4 h-4 text-[#2a7c7c]" />
                </div>
                <h3 className="font-semibold text-gray-900">{trackModal.productName}</h3>
              </div>
              <button onClick={() => setTrackModal(null)}
                className="w-8 h-8 rounded-lg bg-white/80 hover:bg-white flex items-center justify-center shadow-sm transition">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6"><TrackingTimeline productId={trackModal.blockchainId} product={trackModal} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
