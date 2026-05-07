import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getMyProducts, getPreviousOwnerProducts, getTransactions, canUserActOnProduct,
  selfActionOnProduct, transferProduct, closeProduct,
  STAGE_COLORS, STAGE_EMOJIS, CATEGORIES, getReceipts,
} from "../utils/store";
import CategoryNav from "../components/CategoryNav";
import ActionModal from "../components/ActionModal";
import ReceiptModal from "../components/ReceiptModal";
import TrackingTimeline from "../components/TrackingTimeline";
import VideoHero from "../components/VideoHero";
import AIInsightsPanel from "../components/AIInsightsPanel";
import IncomingProducts from "../components/IncomingProducts";
import { Package, ArrowLeftRight, TrendingUp, PlusCircle, ChevronRight, Eye, X, Lock, Download, Leaf, BarChart3, Activity, Clock, DollarSign, ShoppingBag, CheckCircle2, Layers, Plus, Hash } from "lucide-react";
import { getDeliveries } from "../utils/store";
import { getBatches, createBatch, addProductToBatch, getBatchStats, generateBatchId } from "../utils/batches";

export default function Dashboard() {
  const { user } = useAuth();
  const [category, setCategory] = useState(null);
  const [actionModal, setActionModal] = useState(null);
  const [trackModal, setTrackModal] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState("my");
  const [batchModal, setBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({ name: "", category: "", notes: "" });
  const [addToBatchModal, setAddToBatchModal] = useState(null); // product to add
  const [selectedBatchId, setSelectedBatchId] = useState("");

  const role = user?.preferredRole || user?.role || "farmer";
  const myProducts = getMyProducts(user?.email);
  const previousProducts = getPreviousOwnerProducts(user?.email);
  const myTransactions = getTransactions(user?.email);
  const myReceipts = getReceipts(user?.email);

  const activeProducts = myProducts.filter((p) => p.status !== "closed" && p.currentStage !== "Sold");
  const soldProducts = myProducts.filter((p) => p.status === "closed" || p.currentStage === "Sold");

  const filtered = category ? activeProducts.filter((p) => p.category === category) : activeProducts;
  const filteredPrev = category ? previousProducts.filter((p) => p.category === category) : previousProducts;
  const filteredSold = category ? soldProducts.filter((p) => p.category === category) : soldProducts;
  const filteredTx = category ? myTransactions.filter((t) => t.category === category) : myTransactions;

  const totalRevenue = myProducts.reduce((s, p) => s + (p.currentPrice || p.initialPrice || 0), 0);
  const totalCategories = [...new Set(myProducts.map((p) => p.category).filter(Boolean))].length;

  // Delivery stats
  const allDeliveries = getDeliveries(user?.email);
  const completedDel = allDeliveries.filter(d => d.status === "Delivered");
  const deliverySuccessRate = allDeliveries.length > 0 ? Math.round((completedDel.length / allDeliveries.length) * 100) : 100;

  // Batch data
  const myBatches = getBatches(user?.email);
  const batchStats = getBatchStats(user?.email);

  const handleCreateBatch = () => {
    if (!batchForm.name) return;
    createBatch({
      name: batchForm.name,
      category: batchForm.category,
      ownerEmail: user?.email,
      notes: batchForm.notes,
    });
    setBatchForm({ name: "", category: "", notes: "" });
    setBatchModal(false);
    setRefresh((r) => r + 1);
  };

  const handleAddToBatch = () => {
    if (!selectedBatchId || !addToBatchModal) return;
    addProductToBatch(selectedBatchId, String(addToBatchModal.blockchainId));
    setAddToBatchModal(null);
    setSelectedBatchId("");
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

  const tabs = [
    { id: "my", label: "My Products", count: activeProducts.length },
    { id: "previous", label: "Previous", count: previousProducts.length },
    { id: "sold", label: "Sold", count: soldProducts.length },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Hero Banner */}
      <VideoHero
        page="farmer"
        innerPage
        title={<>Welcome, {user?.fullName || "User"} {"\u{1F44B}"}</>}
        subtitle={`${role.charAt(0).toUpperCase() + role.slice(1)} \u00B7 ${myProducts.length} product${myProducts.length !== 1 ? "s" : ""} tracked`}
      >
        <Link to="/products/add" className="inline-flex items-center gap-2 mt-6 px-7 py-3 bg-[#e8604c] text-white text-sm font-semibold rounded-full hover:bg-[#d14e3a] transition shadow-lg active:scale-[0.98] uppercase tracking-wider">
          <PlusCircle className="w-4 h-4" /> Register Product
        </Link>
      </VideoHero>

      {/* Incoming Products */}
      <IncomingProducts userEmail={user?.email} onUpdate={() => setRefresh((r) => r + 1)} />

      {/* Modern Stats Grid - Inspired by Circle Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Big highlight card */}
        <div className="col-span-2 bg-gradient-to-br from-[#2a7c7c] to-[#1d5c5c] rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="relative z-10">
            <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Total Products</p>
            <div className="flex items-end gap-3">
              <p className="text-5xl font-extrabold">{myProducts.length}</p>
              <div className="flex items-center gap-1 text-emerald-300 text-sm font-medium mb-2">
                <TrendingUp className="w-4 h-4" /> Active: {activeProducts.length}
              </div>
            </div>
            <div className="flex gap-6 mt-4">
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider">Categories</p>
                <p className="text-lg font-bold">{totalCategories}</p>
              </div>
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider">Sold</p>
                <p className="text-lg font-bold">{soldProducts.length}</p>
              </div>
              <div>
                <p className="text-white/50 text-[10px] uppercase tracking-wider">Transferred</p>
                <p className="text-lg font-bold">{previousProducts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <ArrowLeftRight className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">{myTransactions.length}</p>
          <p className="text-xs text-gray-500 mt-1 font-medium">Transactions</p>
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${Math.min(myTransactions.length * 10, 100)}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition group">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-gray-900">${totalRevenue}</p>
          <p className="text-xs text-gray-500 mt-1 font-medium">Portfolio Value</p>
          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${Math.min(totalRevenue / 10, 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Delivery & Receipts Mini Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#e6f3f3] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#2a7c7c]" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{deliverySuccessRate}%</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Delivery Success</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{myReceipts.length}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Receipts</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{allDeliveries.length}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Total Deliveries</p>
          </div>
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Register Product", icon: PlusCircle, href: "/products/add", color: "bg-[#e8604c] text-white hover:bg-[#d14e3a]" },
          { label: "View Products", icon: Package, href: "/products", color: "bg-[#e6f3f3] text-[#2a7c7c] hover:bg-[#d1eaea]" },
          { label: "Transactions", icon: BarChart3, href: "/transactions", color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
          { label: "Receipts", icon: Download, href: "/receipts", color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
        ].map((action) => (
          <Link key={action.label} to={action.href}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-sm transition ${action.color}`}>
            <action.icon className="w-4.5 h-4.5" />
            {action.label}
          </Link>
        ))}
      </div>

      {/* AI Insights */}
      <AIInsightsPanel />

      {/* ═══ Batch Management Panel ═══ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Layers className="w-4 h-4 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Product Batches</h2>
              <p className="text-[11px] text-gray-400">Group products into batches for bulk management</p>
            </div>
          </div>
          <button onClick={() => setBatchModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition">
            <Plus className="w-3.5 h-3.5" /> New Batch
          </button>
        </div>

        {/* Batch Stats */}
        <div className="grid grid-cols-3 gap-px bg-gray-100">
          <div className="bg-white p-4 text-center">
            <p className="text-2xl font-bold text-gray-900">{batchStats.total}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Total Batches</p>
          </div>
          <div className="bg-white p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{batchStats.active}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Active</p>
          </div>
          <div className="bg-white p-4 text-center">
            <p className="text-2xl font-bold text-[#2a7c7c]">{batchStats.totalProducts}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Products in Batches</p>
          </div>
        </div>

        {/* Batch List */}
        {myBatches.length === 0 ? (
          <div className="p-8 text-center">
            <Layers className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No batches created yet</p>
            <p className="text-xs text-gray-300 mt-1">Create a batch to group your products</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {myBatches.slice(0, 5).map((b) => {
              const catInfo = CATEGORIES.find((c) => c.id === b.category);
              return (
                <div key={b.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <Hash className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{b.name}</p>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">{b.id}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {catInfo && <span className="text-xs text-gray-400">{catInfo.emoji} {catInfo.label}</span>}
                      <span className="text-xs text-gray-400">{b.productIds?.length || 0} products</span>
                      {b.notes && <span className="text-xs text-gray-300 truncate max-w-[150px]">{b.notes}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${b.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {b.status}
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(b.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Batch Modal */}
      {batchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setBatchModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Create New Batch</h3>
              <button onClick={() => setBatchModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Batch Name *</label>
                <input value={batchForm.name} onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  placeholder="e.g. Ethiopian Yirgacheffe Q1 2026"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Category</label>
                <select value={batchForm.category} onChange={(e) => setBatchForm({ ...batchForm, category: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1 block">Notes</label>
                <textarea value={batchForm.notes} onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })}
                  placeholder="Optional notes about this batch..."
                  rows={2}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
              </div>
              <button onClick={handleCreateBatch}
                disabled={!batchForm.name}
                className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed">
                Create Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Batch Modal */}
      {addToBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setAddToBatchModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Add to Batch</h3>
              <button onClick={() => setAddToBatchModal(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Add <strong>{addToBatchModal.productName}</strong> to a batch:</p>
              {myBatches.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No batches available. Create one first.</p>
              ) : (
                <>
                  <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <option value="">Select a batch...</option>
                    {myBatches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} ({b.id}) - {b.productIds?.length || 0} items</option>
                    ))}
                  </select>
                  <button onClick={handleAddToBatch}
                    disabled={!selectedBatchId}
                    className="w-full py-2.5 bg-[#2a7c7c] text-white text-sm font-semibold rounded-xl hover:bg-[#1d5c5c] transition disabled:opacity-40 disabled:cursor-not-allowed">
                    Add to Batch
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <CategoryNav selected={category} onSelect={setCategory} />

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100/80 rounded-xl p-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition ${
              activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {tab.label} {tab.count > 0 && <span className="ml-1 text-xs text-gray-400">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* My Products Grid */}
      {activeTab === "my" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#e6f3f3] flex items-center justify-center">
                <Package className="w-4 h-4 text-[#2a7c7c]" />
              </div>
              <h2 className="font-semibold text-gray-900">My Products</h2>
            </div>
            <Link to="/products" className="text-sm text-[#2a7c7c] hover:text-[#1d5c5c] flex items-center gap-1 font-medium">View all <ChevronRight className="w-3.5 h-3.5" /></Link>
          </div>
          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium mb-1">No active products</p>
              <p className="text-gray-400 text-sm mb-4">Start by registering your first product</p>
              <Link to="/products/add" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2a7c7c] text-white text-sm font-medium rounded-xl hover:bg-[#1d5c5c] transition">
                <PlusCircle className="w-4 h-4" /> Register Product
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {filtered.map((p, i) => {
                const isOwner = canUserActOnProduct(user?.email, p);
                const catInfo = CATEGORIES.find((c) => c.id === p.category);
                return (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 hover:shadow-lg hover:border-[#2a7c7c]/20 transition-all duration-200 group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2a7c7c] to-[#1d5c5c] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {p.productName?.[0]?.toUpperCase() || "P"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm group-hover:text-[#2a7c7c] transition">{p.productName}</h3>
                          <p className="text-[10px] text-gray-400 font-mono">{p.batchId}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      {catInfo && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-50 text-gray-500">{catInfo.emoji} {catInfo.label}</span>}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STAGE_COLORS[p.currentStage] || "bg-gray-100"}`}>
                        {STAGE_EMOJIS[p.currentStage] || ""} {p.currentStage}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-[#2a7c7c]">${p.currentPrice || p.initialPrice}</p>
                      {isOwner && (
                        <div className="flex gap-1.5">
                          <button onClick={() => setActionModal({ product: p })}
                            className="px-3 py-1.5 bg-[#2a7c7c] text-white text-[11px] font-semibold rounded-lg hover:bg-[#1d5c5c] transition shadow-sm">
                            Proceed
                          </button>
                          <button onClick={() => setAddToBatchModal(p)}
                            className="px-2.5 py-1.5 bg-indigo-50 text-indigo-600 text-[11px] font-medium rounded-lg hover:bg-indigo-100 transition"
                            title="Add to Batch">
                            <Layers className="w-3 h-3 inline" />
                          </button>
                          <button onClick={() => setTrackModal(p)}
                            className="px-2.5 py-1.5 bg-gray-50 text-gray-600 text-[11px] font-medium rounded-lg hover:bg-gray-100 transition">
                            <Eye className="w-3 h-3 inline" />
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
      )}

      {/* Previous Products */}
      {activeTab === "previous" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <Lock className="w-4 h-4 text-gray-500" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Products I Previously Owned</h2>
              <p className="text-[11px] text-gray-400">Read-only access - view and track history</p>
            </div>
          </div>
          {filteredPrev.length === 0 ? (
            <div className="p-12 text-center">
              <Lock className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400">No previous products</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {filteredPrev.map((p, i) => {
                const catInfo = CATEGORIES.find((c) => c.id === p.category);
                return (
                  <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50/40">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-700 text-sm">{p.productName}</h3>
                      <div className="flex gap-1">
                        {catInfo && <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-600">{catInfo.emoji}</span>}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${STAGE_COLORS[p.currentStage] || "bg-gray-100"}`}>
                          {STAGE_EMOJIS[p.currentStage] || ""} {p.currentStage}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Owner: {p.ownerEmail}</p>
                    <div className="flex items-center gap-1.5 mt-3">
                      <Lock className="w-3 h-3 text-gray-300" />
                      <span className="text-[11px] text-gray-400">View Only</span>
                      <button onClick={() => setTrackModal(p)}
                        className="ml-auto px-2.5 py-1.5 bg-purple-50 text-purple-700 text-[11px] font-medium rounded-lg hover:bg-purple-100 transition">
                        <Eye className="w-3 h-3 inline" /> Track
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Sold Products */}
      {activeTab === "sold" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
            </div>
            <h2 className="font-semibold text-gray-900">Sold Products</h2>
          </div>
          {filteredSold.length === 0 ? (
            <div className="p-12 text-center"><p className="text-gray-400">No sold products yet</p></div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {filteredSold.map((p, i) => (
                <div key={i} className="border border-emerald-100 rounded-xl p-4 bg-emerald-50/30">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-700 text-sm">{p.productName}</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-700">{"\u2705"} Sold</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-700">${p.currentPrice || p.initialPrice}</p>
                  <div className="flex gap-1.5 mt-3">
                    <button onClick={() => setTrackModal(p)}
                      className="px-2.5 py-1.5 bg-purple-50 text-purple-700 text-[11px] font-medium rounded-lg hover:bg-purple-100 transition">
                      <Eye className="w-3 h-3 inline" /> Track
                    </button>
                    {myReceipts.find((r) => String(r.productId) === String(p.blockchainId)) && (
                      <button onClick={() => setReceiptModal(myReceipts.find((r) => String(r.productId) === String(p.blockchainId)))}
                        className="px-2.5 py-1.5 bg-green-50 text-green-700 text-[11px] font-medium rounded-lg hover:bg-green-100 transition">
                        <Download className="w-3 h-3 inline" /> Receipt
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Activity Timeline */}
      {filteredTx.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-[#e6f3f3] flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#2a7c7c]" />
            </div>
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {filteredTx.slice(0, 5).map((tx, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2a7c7c]/10 to-[#2a7c7c]/5 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-[#2a7c7c]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.productName}</p>
                  <p className="text-xs text-gray-400">
                    {tx.type} {tx.flowType === "transfer" ? `\u2022 To: ${tx.buyer}` : ""} {tx.movementType ? `\u2022 ${tx.movementType}` : ""}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">${tx.price}</p>
                  <p className="text-[10px] text-gray-400">{new Date(tx.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <ActionModal product={actionModal.product} user={user} onComplete={handleActionComplete} onClose={() => setActionModal(null)} />
      )}

      {/* Receipt Modal */}
      {receiptModal && (
        <ReceiptModal receipt={receiptModal} onClose={() => setReceiptModal(null)} />
      )}

      {/* Track Modal */}
      {trackModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setTrackModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#e6f3f3] to-[#dceeed]">
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
