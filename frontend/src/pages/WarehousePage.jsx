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
import { Package, Eye, X, Building2, Lock, TrendingUp, BoxIcon, Send, RefreshCw, BarChart3, Archive, ArrowUpRight, Boxes, ClipboardList, AlertTriangle, MapPin } from "lucide-react";
import { getInventory, getInventoryStats, getLowStockAlerts, addToInventory, updateInventoryQuantity, removeFromInventory, generateRackLocation } from "../utils/inventory";

export default function WarehousePage() {
  const { user } = useAuth();
  const [category, setCategory] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [trackModal, setTrackModal] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [invModal, setInvModal] = useState(false);
  const [invForm, setInvForm] = useState({ productName: "", category: "agriculture", quantity: 1, rackLocation: "", notes: "" });
  const [invEdit, setInvEdit] = useState(null); // { productId, qty }

  const role = user?.preferredRole || user?.role || "warehouse";
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
  const inventoryValue = myProducts.reduce((s, p) => s + (p.currentPrice || p.initialPrice || 0), 0);
  const totalItems = myProducts.length + previousProducts.length;
  const storedItems = myProducts.filter((p) => p.currentStage === "Stored" || p.currentStage === "Received").length;
  const dispatchedCount = previousProducts.length;
  const storageUtilization = totalItems > 0 ? Math.round((myProducts.length / Math.max(totalItems, 1)) * 100) : 0;
  const dispatchRate = totalItems > 0 ? Math.round((dispatchedCount / Math.max(totalItems, 1)) * 100) : 0;
  const storedPercent = myProducts.length > 0 ? Math.round((storedItems / myProducts.length) * 100) : 0;
  const uniqueRecipients = new Set(previousProducts.map((p) => p.ownerEmail)).size || 0;

  return (
    <div className="w-full space-y-6 pb-12">
      {/* ---- Video Hero Banner ---- */}
      <VideoHero
        page="warehouse"
        innerPage
        title={<>{"\u{1F3E2}"} {user?.fullName} <span className="capitalize">({role})</span></>}
        subtitle="Store, manage, and dispatch inventory across your warehouse"
      />

      {/* ---- Incoming Products ---- */}
      <IncomingProducts userEmail={user?.email} onUpdate={() => setRefresh((r) => r + 1)} />

      {/* ---- Category Filter ---- */}
      <CategoryNav selected={category} onSelect={setCategory} />

      {/* ---- Large Highlight Stat Card ---- */}
      <div className="rounded-2xl p-6 shadow-lg relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #5c3d2e 0%, #2a7c7c 50%, #3d6b6b 100%)" }}>
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10 bg-white" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-10 bg-white" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full opacity-[0.06] bg-white" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <p className="text-amber-100 text-sm font-medium">Total Warehouse Value</p>
            </div>
            <p className="text-4xl font-extrabold text-white tracking-tight">${inventoryValue.toLocaleString()}</p>
            <p className="text-teal-200 text-xs mt-1">
              Across {myProducts.length} item{myProducts.length !== 1 ? "s" : ""} currently in storage
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-white">{totalItems}</p>
              <p className="text-[10px] text-amber-100 font-medium uppercase tracking-wider">Total Items</p>
            </div>
            <div className="bg-white/15 backdrop-blur rounded-xl px-4 py-3 text-center min-w-[80px]">
              <p className="text-2xl font-bold text-white">{uniqueRecipients}</p>
              <p className="text-[10px] text-teal-100 font-medium uppercase tracking-wider">Recipients</p>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Stat Cards Grid with Progress Bars ---- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Inventory Count */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#f0e6dc] group-hover:scale-110 transition-transform">
              <Boxes className="w-5 h-5 text-[#8B5E3C]" />
            </div>
            <span className="text-[10px] font-semibold text-[#8B5E3C] bg-[#f0e6dc] px-2 py-0.5 rounded-full uppercase tracking-wider">Stock</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{myProducts.length}</p>
          <p className="text-xs text-gray-500 mb-2">Inventory Count</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${storageUtilization}%`, background: "linear-gradient(90deg, #8B5E3C, #a0714d)" }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{storageUtilization}% of total inventory</p>
        </div>

        {/* Stored Items */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#d1eaea] group-hover:scale-110 transition-transform">
              <Archive className="w-5 h-5 text-[#2a7c7c]" />
            </div>
            <span className="text-[10px] font-semibold text-[#2a7c7c] bg-[#d1eaea] px-2 py-0.5 rounded-full uppercase tracking-wider">Stored</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{storedItems}</p>
          <p className="text-xs text-gray-500 mb-2">Stored Items</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${storedPercent}%`, background: "linear-gradient(90deg, #2a7c7c, #3d9e9e)" }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{storedPercent}% of current stock</p>
        </div>

        {/* Dispatched */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-50 group-hover:scale-110 transition-transform">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Sent</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{dispatchedCount}</p>
          <p className="text-xs text-gray-500 mb-2">Dispatched</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-purple-400 transition-all duration-500" style={{ width: `${dispatchRate}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{dispatchRate}% dispatch rate</p>
        </div>

        {/* Warehouse Value */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-50 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex items-center gap-1 text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              <span className="text-[10px] font-semibold">Active</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">${inventoryValue.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mb-2">Warehouse Value</p>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: "100%", background: "linear-gradient(90deg, #d97706, #f59e0b)" }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">Current portfolio value</p>
        </div>
      </div>

      {/* ---- Quick Action Buttons ---- */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => { if (myProducts.length > 0) setActionModal({ product: myProducts[0] }); }}
          disabled={myProducts.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "linear-gradient(135deg, #5c3d2e, #8B5E3C)" }}
        >
          <Package className="w-4 h-4" /> Process Next Item
        </button>
        <button
          onClick={() => { if (myProducts.length > 0) setTrackModal(myProducts[0]); }}
          disabled={myProducts.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ClipboardList className="w-4 h-4" /> View Tracking
        </button>
        <button
          onClick={() => setRefresh((r) => r + 1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 shadow-sm hover:shadow-md transition-all"
        >
          <RefreshCw className="w-4 h-4" /> Refresh Data
        </button>
        <div className="ml-auto flex items-center gap-2 text-xs text-gray-400">
          <BarChart3 className="w-3.5 h-3.5" />
          <span>{totalItems} total items tracked</span>
        </div>
      </div>

      {/* ---- Warehouse Inventory (Product List) ---- */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #faf6f2 0%, #f0fafa 100%)" }}>
          <div>
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #5c3d2e, #2a7c7c)" }}>
                <Package className="w-4 h-4 text-white" />
              </span>
              Warehouse Inventory
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              You are acting as <strong className="capitalize text-[#2a7c7c]">{role}</strong> &middot; {myProducts.length} item{myProducts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#d1eaea] text-[#2a7c7c] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2a7c7c] animate-pulse" /> Live
            </span>
          </div>
        </div>
        {myProducts.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No products in warehouse</p>
            <p className="text-xs text-gray-300 mt-1">Items will appear here once they are received</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {myProducts.map((p, i) => {
              const isOwner = canUserActOnProduct(user?.email, p);
              const catInfo = CATEGORIES.find((c) => c.id === p.category);
              const priceVal = p.currentPrice || p.initialPrice || 0;
              return (
                <div key={i} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-all group bg-white">
                  {/* card top accent bar */}
                  <div className="h-1" style={{ background: "linear-gradient(90deg, #5c3d2e, #2a7c7c)" }} />
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-[#2a7c7c] transition-colors">{p.productName}</h3>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        {catInfo && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">{catInfo.emoji}</span>}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap ${STAGE_COLORS[p.currentStage] || "bg-gray-100"}`}>
                          {STAGE_EMOJIS[p.currentStage] || ""} {p.currentStage}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                      <span className="font-mono bg-gray-50 px-1.5 py-0.5 rounded text-[10px]">{p.batchId}</span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-lg font-bold" style={{ color: "#5c3d2e" }}>${priceVal}</span>
                      <span className="text-[10px] text-gray-400">current value</span>
                    </div>
                    {p.storageConditions && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1 bg-amber-50/60 px-2 py-1 rounded-lg">
                        <Archive className="w-3 h-3 text-amber-500" />
                        <span>{p.storageConditions}</span>
                      </div>
                    )}
                    {isOwner && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-gray-50">
                        <button onClick={() => setActionModal({ product: p })}
                          className="flex-1 px-3 py-2 text-white text-xs font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                          style={{ background: "linear-gradient(135deg, #2a7c7c, #3d9e9e)" }}>
                          Proceed
                        </button>
                        <button onClick={() => setTrackModal(p)}
                          className="px-3 py-2 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg hover:bg-purple-100 transition flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5" /> Track
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Inventory Management Panel ---- */}
      {(() => {
        const invStats = getInventoryStats(user?.email);
        const alerts = getLowStockAlerts(user?.email);
        const inventoryItems = getInventory(user?.email);
        return (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-[#f0fafa]/50">
              <div>
                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Archive className="w-4 h-4 text-amber-700" />
                  </span>
                  Inventory Management
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {invStats.totalProducts} product{invStats.totalProducts !== 1 ? "s" : ""} &middot; {invStats.totalItems} total units &middot; Rack utilization: {invStats.rackUtilization}%
                </p>
              </div>
              <button onClick={() => { setInvForm({ productName: "", category: "agriculture", quantity: 1, rackLocation: generateRackLocation(), notes: "" }); setInvModal(true); }}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-white shadow-sm hover:shadow-md transition"
                style={{ background: "linear-gradient(135deg, #5c3d2e, #8B5E3C)" }}>
                + Add Item
              </button>
            </div>

            {/* Low Stock Alerts */}
            {alerts.length > 0 && (
              <div className="px-6 py-3 bg-amber-50 border-b border-amber-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Low Stock Alerts ({alerts.length})</span>
                </div>
                <div className="space-y-1.5">
                  {alerts.map((a, i) => (
                    <div key={i} className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg ${a.alertLevel === "critical" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.alertLevel === "critical" ? "bg-red-500 animate-pulse" : "bg-amber-500"}`} />
                      {a.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inventory Stats Bar */}
            <div className="grid grid-cols-4 gap-px bg-gray-100 border-b border-gray-100">
              {[
                { label: "In Stock", value: invStats.inStock, color: "text-green-600", bg: "bg-green-50" },
                { label: "Low Stock", value: invStats.lowStock, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Out of Stock", value: invStats.outOfStock, color: "text-red-600", bg: "bg-red-50" },
                { label: "Total Units", value: invStats.totalItems, color: "text-[#2a7c7c]", bg: "bg-[#e6f3f3]" },
              ].map((s, i) => (
                <div key={i} className="bg-white px-4 py-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Inventory Table */}
            {inventoryItems.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Archive className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400 font-medium">No inventory items yet</p>
                <p className="text-xs text-gray-300 mt-1">Add items to track rack locations and stock levels</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f5f3ee] text-left">
                      <th className="px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Rack</th>
                      <th className="px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Qty</th>
                      <th className="px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {inventoryItems.map((item, i) => (
                      <tr key={i} className="hover:bg-[#f5f3ee]/50 transition">
                        <td className="px-5 py-3">
                          <p className="text-sm font-semibold text-[#2c3e50]">{item.productName || `Product ${item.productId}`}</p>
                          <p className="text-[10px] text-gray-400 capitalize">{item.category}</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#e6f3f3] text-[#2a7c7c] text-xs font-mono font-semibold">
                            <MapPin className="w-3 h-3" /> {item.rackLocation}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {invEdit && invEdit.productId === item.productId ? (
                            <div className="flex items-center gap-1">
                              <input type="number" min="0" value={invEdit.qty}
                                onChange={e => setInvEdit({ ...invEdit, qty: e.target.value })}
                                className="w-16 px-2 py-1 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-[#2a7c7c] focus:outline-none" />
                              <button onClick={() => {
                                updateInventoryQuantity(item.productId, user?.email, parseInt(invEdit.qty) || 0);
                                setInvEdit(null); setRefresh(r => r + 1);
                              }} className="px-2 py-1 text-[10px] bg-[#2a7c7c] text-white rounded font-semibold">Save</button>
                              <button onClick={() => setInvEdit(null)} className="px-2 py-1 text-[10px] bg-gray-100 text-gray-600 rounded">Cancel</button>
                            </div>
                          ) : (
                            <span className={`text-sm font-bold ${item.quantity <= 2 ? "text-red-600" : item.quantity <= 5 ? "text-amber-600" : "text-gray-900"}`}>
                              {item.quantity}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === "out_of_stock" ? "bg-red-50 text-red-600" :
                            item.status === "low_stock" ? "bg-amber-50 text-amber-600" :
                            "bg-green-50 text-green-600"
                          }`}>
                            {item.status === "out_of_stock" ? "Out" : item.status === "low_stock" ? "Low" : "In Stock"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setInvEdit({ productId: item.productId, qty: item.quantity })}
                              className="px-2 py-1 text-[10px] font-semibold rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                              Edit Qty
                            </button>
                            <button onClick={() => { removeFromInventory(item.productId, user?.email); setRefresh(r => r + 1); }}
                              className="px-2 py-1 text-[10px] font-semibold rounded bg-red-50 text-red-600 hover:bg-red-100 transition">
                              -1
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {/* ---- Add Inventory Modal ---- */}
      {invModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setInvModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-[#f0fafa]">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Archive className="w-4 h-4 text-amber-700" /> Add to Inventory
              </h3>
              <button onClick={() => setInvModal(false)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Product Name</label>
                <input type="text" value={invForm.productName} onChange={e => setInvForm({ ...invForm, productName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30 focus:border-[#2a7c7c]"
                  placeholder="e.g. Ethiopian Yirgacheffe Coffee" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                  <select value={invForm.category} onChange={e => setInvForm({ ...invForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30 focus:border-[#2a7c7c]">
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Quantity</label>
                  <input type="number" min="1" value={invForm.quantity} onChange={e => setInvForm({ ...invForm, quantity: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30 focus:border-[#2a7c7c]" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Rack Location</label>
                <div className="flex items-center gap-2">
                  <input type="text" value={invForm.rackLocation} onChange={e => setInvForm({ ...invForm, rackLocation: e.target.value })}
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30 focus:border-[#2a7c7c]"
                    placeholder="e.g. A3-07" />
                  <button onClick={() => setInvForm({ ...invForm, rackLocation: generateRackLocation() })}
                    className="px-3 py-2.5 text-xs font-semibold rounded-lg bg-[#e6f3f3] text-[#2a7c7c] hover:bg-[#d1eaea] transition">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Format: Zone(A-E) + Level(1-5) - Slot(01-20)</p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes (optional)</label>
                <input type="text" value={invForm.notes} onChange={e => setInvForm({ ...invForm, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30 focus:border-[#2a7c7c]"
                  placeholder="Storage conditions, etc." />
              </div>
              <button onClick={() => {
                if (!invForm.productName.trim()) return;
                addToInventory({
                  warehouseEmail: user?.email,
                  productId: `INV-${Date.now()}`,
                  productName: invForm.productName,
                  category: invForm.category,
                  quantity: parseInt(invForm.quantity) || 1,
                  rackLocation: invForm.rackLocation || generateRackLocation(),
                  notes: invForm.notes,
                });
                setInvModal(false);
                setRefresh(r => r + 1);
              }}
                className="w-full py-2.5 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition text-sm"
                style={{ background: "linear-gradient(135deg, #2a7c7c, #3d9e9e)" }}>
                Add to Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Dispatched Products ---- */}
      {previousProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50/50 to-gray-50/50">
            <div>
              <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Send className="w-4 h-4 text-purple-600" />
                </span>
                Dispatched Products
              </h2>
              <p className="text-xs text-gray-500 mt-1">{previousProducts.length} item{previousProducts.length !== 1 ? "s" : ""} dispatched to recipients</p>
            </div>
            <div className="text-xs text-gray-400 hidden sm:block">
              {uniqueRecipients} unique recipient{uniqueRecipients !== 1 ? "s" : ""}
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {previousProducts.map((p, i) => (
              <div key={i} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/30 hover:bg-white hover:shadow-md transition-all group">
                <div className="h-1 bg-gradient-to-r from-purple-300 to-purple-100" />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-700 group-hover:text-gray-900 transition-colors">{p.productName}</h3>
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3 text-purple-400" />
                    Dispatched to: <span className="font-medium text-gray-600">{p.ownerEmail}</span>
                  </p>
                  <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    <Lock className="w-3 h-3 text-gray-400" />
                    <span className="text-[11px] text-gray-400 font-medium">View Only</span>
                    <button onClick={() => setTrackModal(p)}
                      className="ml-auto px-3 py-1.5 bg-purple-50 text-purple-700 text-xs font-semibold rounded-lg hover:bg-purple-100 transition flex items-center gap-1">
                      <Eye className="w-3 h-3" /> Track
                    </button>
                  </div>
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100"
              style={{ background: "linear-gradient(135deg, #faf6f2 0%, #f0fafa 100%)" }}>
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#2a7c7c]" />
                {trackModal.productName}
              </h3>
              <button onClick={() => setTrackModal(null)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
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
