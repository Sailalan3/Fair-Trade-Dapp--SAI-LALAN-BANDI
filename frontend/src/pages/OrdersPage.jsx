import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getOrders, createOrder, updateOrderStatus, ORDER_STATUSES, getOrderStats } from "../utils/orders";
import { getAllProducts, getUsers } from "../utils/store";
import { formatCurrency, CURRENCIES } from "../utils/receiptGenerator";
import VideoHero from "../components/VideoHero";
import { ShoppingCart, Plus, Check, X, Clock, ChevronDown, Filter, Package, Send, AlertCircle } from "lucide-react";

export default function OrdersPage() {
  const { user } = useAuth();
  const [refresh, setRefresh] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState("all"); // all, sent, received
  const [statusFilter, setStatusFilter] = useState("all");

  const orders = getOrders(user?.email);
  const stats = getOrderStats(user?.email);

  const filtered = orders.filter(o => {
    if (filter === "sent" && o.buyerEmail !== user?.email) return false;
    if (filter === "received" && o.sellerEmail !== user?.email) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  const handleStatusUpdate = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
    setRefresh(r => r + 1);
  };

  return (
    <div className="space-y-6 pb-12">
      <VideoHero page="transactions" compact>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white uppercase tracking-tight">Order Management</h1>
        <div className="w-12 h-[3px] bg-[#e8604c] my-2" />
        <p className="text-white/60 text-sm">Manage orders, requests, and approvals</p>
      </VideoHero>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-1">
        {[
          { label: "Total Orders", value: stats.total, icon: ShoppingCart, color: "text-[#2a7c7c] bg-[#e6f3f3]" },
          { label: "Pending", value: stats.pending, icon: Clock, color: "text-amber-600 bg-amber-50" },
          { label: "Completed", value: stats.completed, icon: Check, color: "text-green-600 bg-green-50" },
          { label: "Total Value", value: formatCurrency(stats.totalValue, "GBP"), icon: Package, color: "text-purple-600 bg-purple-50" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-2`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className="text-lg font-bold text-[#2c3e50]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {["all", "sent", "received"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition ${
                filter === f ? "bg-[#2a7c7c] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>{f === "all" ? "All Orders" : f === "sent" ? "My Requests" : "Incoming"}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30">
            <option value="all">All Statuses</option>
            {ORDER_STATUSES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
          </select>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#e8604c] hover:bg-[#d14e3a] text-white text-xs font-semibold rounded-lg transition">
            <Plus className="w-3.5 h-3.5" /> New Order
          </button>
        </div>
      </div>

      {/* Orders List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No orders found</p>
          <button onClick={() => setShowCreate(true)} className="mt-3 text-[#2a7c7c] text-sm font-semibold hover:underline">Create your first order</button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const status = ORDER_STATUSES.find(s => s.id === order.status) || ORDER_STATUSES[0];
            const isBuyer = order.buyerEmail === user?.email;
            const isSeller = order.sellerEmail === user?.email;

            return (
              <div key={order.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-gray-400">{order.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${status.color}`}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <h4 className="font-semibold text-[#2c3e50] mt-1">{order.productName || "Custom Order"}</h4>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-[#2a7c7c]">{formatCurrency(order.totalPrice, order.currency)}</p>
                    <p className="text-[10px] text-gray-400">{order.quantity} x {formatCurrency(order.unitPrice, order.currency)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span>From: <strong className="text-[#2c3e50]">{isBuyer ? "You" : order.buyerName}</strong></span>
                  <span className="text-gray-300">→</span>
                  <span>To: <strong className="text-[#2c3e50]">{isSeller ? "You" : order.sellerName}</strong></span>
                  <span className="ml-auto text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>

                {order.notes && <p className="text-xs text-gray-400 italic mb-3">"{order.notes}"</p>}

                {/* Action buttons for seller on pending orders */}
                {isSeller && order.status === "pending" && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => handleStatusUpdate(order.id, "accepted")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold rounded-lg transition">
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button onClick={() => handleStatusUpdate(order.id, "rejected")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-semibold rounded-lg transition">
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}

                {isSeller && order.status === "accepted" && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => handleStatusUpdate(order.id, "processing")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold rounded-lg transition">
                      Start Processing
                    </button>
                  </div>
                )}

                {isSeller && order.status === "processing" && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => handleStatusUpdate(order.id, "shipped")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white text-xs font-semibold rounded-lg transition">
                      <Send className="w-3 h-3" /> Mark Shipped
                    </button>
                  </div>
                )}

                {(isBuyer && order.status === "shipped") && (
                  <div className="flex gap-2 pt-2 border-t border-gray-100">
                    <button onClick={() => handleStatusUpdate(order.id, "completed")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition">
                      <Check className="w-3 h-3" /> Confirm Received
                    </button>
                  </div>
                )}

                {/* Status timeline */}
                {order.statusHistory?.length > 1 && (
                  <details className="mt-2">
                    <summary className="text-[10px] text-[#2a7c7c] font-semibold cursor-pointer hover:underline">View History</summary>
                    <div className="mt-2 space-y-1">
                      {order.statusHistory.map((sh, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] text-gray-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#2a7c7c]" />
                          <span className="font-semibold capitalize">{sh.status}</span>
                          <span>{new Date(sh.timestamp).toLocaleString()}</span>
                          {sh.note && <span className="text-gray-400">— {sh.note}</span>}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Order Modal */}
      {showCreate && <CreateOrderModal onClose={() => setShowCreate(false)} user={user} onCreated={() => { setRefresh(r => r + 1); setShowCreate(false); }} />}
    </div>
  );
}

function CreateOrderModal({ onClose, user, onCreated }) {
  const users = getUsers();
  const products = getAllProducts();
  const [form, setForm] = useState({
    sellerEmail: "", productName: "", quantity: 1, unitPrice: "", currency: "GBP", notes: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.sellerEmail) { setError("Please select a seller"); return; }
    if (!form.productName) { setError("Please enter a product name"); return; }
    if (!form.unitPrice || parseFloat(form.unitPrice) <= 0) { setError("Please enter a valid price"); return; }

    const seller = users.find(u => u.email === form.sellerEmail);
    createOrder({
      buyerEmail: user.email,
      buyerName: user.fullName,
      sellerEmail: form.sellerEmail,
      sellerName: seller?.fullName || form.sellerEmail,
      productName: form.productName,
      quantity: form.quantity,
      unitPrice: form.unitPrice,
      currency: form.currency,
      notes: form.notes,
    });
    onCreated();
  };

  const otherUsers = users.filter(u => u.email !== user.email);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-[#2a7c7c] px-5 py-4 flex items-center justify-between">
          <h3 className="text-white font-semibold">New Order Request</h3>
          <button onClick={onClose} className="text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Send To (Seller)</label>
            <select value={form.sellerEmail} onChange={e => setForm({ ...form, sellerEmail: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30">
              <option value="">Select a user...</option>
              {otherUsers.map(u => <option key={u.email} value={u.email}>{u.fullName} ({u.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Product Name</label>
            <input type="text" value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })}
              placeholder="e.g. Ethiopian Coffee" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Qty</label>
              <input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Unit Price</label>
              <input type="number" step="0.01" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })}
                placeholder="0.00" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Currency</label>
              <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30">
                {Object.entries(CURRENCIES).map(([code, c]) => <option key={code} value={code}>{c.symbol} {code}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Notes (Optional)</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Special requirements..." rows={2}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30 resize-none" />
          </div>
          {error && <p className="text-[#e8604c] text-xs flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {error}</p>}
          <button type="submit"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-lg transition text-sm">
            <Send className="w-4 h-4" /> Send Order Request
          </button>
        </form>
      </div>
    </div>
  );
}
