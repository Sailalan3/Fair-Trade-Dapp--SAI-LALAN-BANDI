import React, { useState, useEffect } from "react";
import { getProducts, getTransactions, getUsers, getOrders, saveOrders, getTracking, STAGE_COLORS, STAGE_EMOJIS, CATEGORIES } from "../utils/store";
import CategoryNav from "../components/CategoryNav";
import TrackingTimeline from "../components/TrackingTimeline";
import VideoHero from "../components/VideoHero";
import { Users, Package, ArrowLeftRight, BarChart3, Eye, X, CheckCircle, Shield, Activity, RefreshCw, Settings, Download, TrendingUp } from "lucide-react";

export default function AdminPage() {
  const [tab, setTab] = useState("overview");
  const [category, setCategory] = useState(null);
  const [modal, setModal] = useState(null);
  const [refresh, setRefresh] = useState(0);

  // Read all data from localStorage
  const allUsers = getUsers().map(({ password, ...u }) => u);
  const allProducts = getProducts();
  const allTransactions = getTransactions();
  const allOrders = getOrders();

  const products = category ? allProducts.filter((p) => p.category === category) : allProducts;
  const transactions = category ? allTransactions.filter((t) => t.category === category) : allTransactions;

  const handleToggleUser = (email) => {
    const users = JSON.parse(localStorage.getItem("fairtrace_users") || "[]");
    const idx = users.findIndex((u) => u.email === email);
    if (idx !== -1) {
      users[idx].disabled = !users[idx].disabled;
      localStorage.setItem("fairtrace_users", JSON.stringify(users));
      setRefresh((r) => r + 1);
    }
  };

  const handleOrderStatus = (orderId, newStatus) => {
    const orders = getOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = newStatus;
      orders[idx].updatedAt = new Date().toISOString();
      saveOrders(orders);
      setRefresh((r) => r + 1);
    }
  };

  const stageCount = (stage) => products.filter((p) => p.currentStage === stage).length;

  const activeUsers = allUsers.filter((u) => !u.disabled).length;
  const systemHealthPct = allUsers.length > 0 ? Math.round((activeUsers / allUsers.length) * 100) : 100;

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: `Users (${allUsers.length})`, icon: Users },
    { id: "products", label: `Products (${products.length})`, icon: Package },
    { id: "transactions", label: `Transactions (${transactions.length})`, icon: ArrowLeftRight },
  ];

  return (
    <div className="w-full pb-12" style={{ minHeight: "100vh" }}>
      <VideoHero
        page="transactions"
        innerPage
        title={<>Admin Dashboard</>}
        subtitle="System overview &middot; Manage users, products, and transactions"
      />

      {/* Category Nav */}
      <div className="mt-6">
        <CategoryNav selected={category} onSelect={setCategory} />
      </div>

      {/* Tab Navigation - deep navy admin style */}
      <div className="mt-6 flex gap-1 p-1.5 rounded-2xl" style={{ background: "linear-gradient(135deg, #0f2027 0%, #163a3a 50%, #0f2027 100%)" }}>
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-xl transition-all duration-200 flex-1 justify-center"
              style={isActive
                ? { background: "linear-gradient(135deg, #2a7c7c, #1d5c5c)", color: "#fff", boxShadow: "0 4px 15px rgba(42,124,124,0.4)" }
                : { background: "transparent", color: "rgba(255,255,255,0.6)" }
              }
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.9)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── OVERVIEW ─── */}
      {tab === "overview" && (
        <div className="mt-8 space-y-6">

          {/* Hero Stat Card - Total Users */}
          <div className="relative overflow-hidden rounded-2xl p-8" style={{ background: "linear-gradient(135deg, #0f2027 0%, #1a4a4a 40%, #2a7c7c 100%)" }}>
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle, #2a7c7c, transparent)", transform: "translate(30%, -30%)" }} />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-5" style={{ background: "radial-gradient(circle, #fff, transparent)", transform: "translate(-20%, 20%)" }} />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium tracking-wide uppercase" style={{ color: "rgba(255,255,255,0.6)" }}>Total Users</p>
                <p className="text-6xl font-extrabold text-white mt-2">{allUsers.length}</p>
                <p className="text-sm mt-3" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {activeUsers} active &middot; {allUsers.length - activeUsers} disabled
                </p>
              </div>
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
                <Users className="w-10 h-10 text-white" />
              </div>
            </div>
            {/* Progress bar */}
            <div className="relative z-10 mt-6">
              <div className="flex items-center justify-between text-xs mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
                <span>Active rate</span>
                <span className="font-semibold text-white">{systemHealthPct}%</span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
                <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${systemHealthPct}%`, background: "linear-gradient(90deg, #4fd1c5, #81e6d9)" }} />
              </div>
            </div>
          </div>

          {/* Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                label: "Products",
                value: products.length,
                icon: Package,
                gradient: "linear-gradient(135deg, #0f2027, #1a3a3a)",
                progress: Math.min(100, products.length * 10),
                sub: `${CATEGORIES.length} categories`,
              },
              {
                label: "Transactions",
                value: transactions.length,
                icon: ArrowLeftRight,
                gradient: "linear-gradient(135deg, #1a3a2a, #2a7c5c)",
                progress: Math.min(100, transactions.length * 5),
                sub: "all-time total",
              },
              {
                label: "System Health",
                value: `${systemHealthPct}%`,
                icon: Activity,
                gradient: "linear-gradient(135deg, #1a2a3a, #2a5c7c)",
                progress: systemHealthPct,
                sub: systemHealthPct >= 80 ? "Healthy" : "Needs attention",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{ background: s.gradient }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>{s.label}</p>
                    <p className="text-3xl font-bold text-white mt-1">{s.value}</p>
                    <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{s.sub}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <s.icon className="w-5 h-5 text-white opacity-80" />
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                  <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${s.progress}%`, background: "linear-gradient(90deg, #4fd1c5, #81e6d9)" }} />
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions Row */}
          <div className="rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #f8fffe 0%, #edf7f7 100%)", border: "1px solid #d1eaea" }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: "#0f2027" }}>Quick Actions</h3>
            <div className="flex gap-3 flex-wrap">
              {[
                { label: "View Users", icon: Users, action: () => setTab("users") },
                { label: "View Products", icon: Package, action: () => setTab("products") },
                { label: "Transactions", icon: ArrowLeftRight, action: () => setTab("transactions") },
                { label: "Refresh Data", icon: RefreshCw, action: () => setRefresh((r) => r + 1) },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md"
                  style={{ background: "#fff", color: "#1d5c5c", border: "1px solid #d1eaea" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "#2a7c7c"; e.currentTarget.style.color = "#fff"; e.currentTarget.style.borderColor = "#2a7c7c"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#1d5c5c"; e.currentTarget.style.borderColor = "#d1eaea"; }}
                >
                  <btn.icon className="w-4 h-4" />
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Supply Chain Pipeline */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
            <div className="px-6 py-4" style={{ background: "linear-gradient(135deg, #0f2027, #163a3a)" }}>
              <h2 className="font-semibold text-white text-sm tracking-wide uppercase">Supply Chain Pipeline</h2>
            </div>
            <div className="bg-white p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                {["Registered", "Processed", "Exported", "Retailed", "Sold"].map((stage, idx) => (
                  <React.Fragment key={stage}>
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "linear-gradient(135deg, #edf7f7, #d1eaea)" }}>
                        {STAGE_EMOJIS[stage]}
                      </div>
                      <span className="text-lg font-bold" style={{ color: "#0f2027" }}>{stageCount(stage)}</span>
                      <span className="text-[11px] font-medium" style={{ color: "#2a7c7c" }}>{stage}</span>
                    </div>
                    {idx < 4 && (
                      <div className="hidden sm:block flex-shrink-0">
                        <div className="w-8 h-0.5" style={{ background: "linear-gradient(90deg, #d1eaea, #2a7c7c, #d1eaea)" }} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Users by Role */}
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #e2e8f0" }}>
            <div className="px-6 py-4" style={{ background: "linear-gradient(135deg, #0f2027, #163a3a)" }}>
              <h2 className="font-semibold text-white text-sm tracking-wide uppercase">Users by Role</h2>
            </div>
            <div className="bg-white p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {["farmer", "processor", "exporter", "retailer", "roaster", "admin"].map((role) => {
                  const count = allUsers.filter((u) => u.role === role).length;
                  const pct = allUsers.length > 0 ? Math.round((count / allUsers.length) * 100) : 0;
                  return (
                    <div key={role} className="rounded-xl p-4 text-center" style={{ background: "linear-gradient(135deg, #f8fffe, #edf7f7)", border: "1px solid #d1eaea" }}>
                      <p className="text-2xl font-bold" style={{ color: "#0f2027" }}>{count}</p>
                      <p className="text-xs font-medium capitalize mt-1" style={{ color: "#2a7c7c" }}>{role}s</p>
                      <div className="h-1 rounded-full mt-3" style={{ background: "#d1eaea" }}>
                        <div className="h-1 rounded-full" style={{ width: `${pct}%`, background: "linear-gradient(90deg, #2a7c7c, #1d5c5c)", minWidth: count > 0 ? "8px" : "0" }} />
                      </div>
                      <p className="text-[10px] mt-1" style={{ color: "rgba(15,32,39,0.4)" }}>{pct}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── USERS ─── */}
      {tab === "users" && (
        <div className="mt-8">
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #e2e8f0" }}>
            {/* Table header bar */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0f2027, #163a3a)" }}>
              <div>
                <h2 className="font-semibold text-white text-sm tracking-wide uppercase">User Management</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{allUsers.length} registered users</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                <Shield className="w-4 h-4 text-white opacity-70" />
              </div>
            </div>

            {allUsers.length === 0 ? (
              <div className="p-12 text-center bg-white">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#edf7f7" }}>
                  <Users className="w-8 h-8" style={{ color: "#2a7c7c" }} />
                </div>
                <p className="text-gray-600 font-medium">No users registered yet</p>
                <p className="text-gray-400 text-sm mt-1">Users will appear here after they create accounts</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#f8fffe" }}>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Name</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Email</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Role</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Joined</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Status</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.map((u, i) => (
                      <tr key={i} className="transition-colors duration-150" style={{ borderBottom: "1px solid #f0f5f5" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f8fffe"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #2a7c7c, #1d5c5c)" }}>
                              {u.fullName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="font-semibold" style={{ color: "#0f2027" }}>{u.fullName || "\u2014"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize" style={{ background: "#edf7f7", color: "#1d5c5c" }}>{u.role}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "\u2014"}</td>
                        <td className="px-6 py-4">
                          {u.disabled ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              Disabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#edf7f7", color: "#1d5c5c" }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#2a7c7c" }} />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => handleToggleUser(u.email)}
                            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                            style={u.disabled
                              ? { background: "linear-gradient(135deg, #2a7c7c, #1d5c5c)", color: "#fff" }
                              : { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }
                            }
                            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.transform = "translateY(-1px)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
                          >
                            {u.disabled ? "Enable" : "Disable"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PRODUCTS ─── */}
      {tab === "products" && (
        <div className="mt-8">
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #e2e8f0" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0f2027, #163a3a)" }}>
              <div>
                <h2 className="font-semibold text-white text-sm tracking-wide uppercase">Product Registry</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{products.length} products tracked</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                <Package className="w-4 h-4 text-white opacity-70" />
              </div>
            </div>

            {products.length === 0 ? (
              <div className="p-12 text-center bg-white">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#edf7f7" }}>
                  <Package className="w-8 h-8" style={{ color: "#2a7c7c" }} />
                </div>
                <p className="text-gray-600 font-medium">No products yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#f8fffe" }}>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Product</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Category</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Batch</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Stage</th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Price</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Track</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={i} className="transition-colors duration-150" style={{ borderBottom: "1px solid #f0f5f5" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f8fffe"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <td className="px-6 py-4 font-semibold" style={{ color: "#0f2027" }}>{p.productName}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize" style={{ background: "#edf7f7", color: "#1d5c5c" }}>{p.category || "\u2014"}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 font-mono">{p.batchId}</td>
                        <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STAGE_COLORS[p.currentStage] || ""}`}>{p.currentStage}</span></td>
                        <td className="px-6 py-4 text-right font-bold" style={{ color: "#0f2027" }}>${p.currentPrice || p.initialPrice}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setModal({ product: p })}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                            style={{ background: "#edf7f7", color: "#2a7c7c" }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "#2a7c7c"; e.currentTarget.style.color = "#fff"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "#edf7f7"; e.currentTarget.style.color = "#2a7c7c"; }}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TRANSACTIONS ─── */}
      {tab === "transactions" && (
        <div className="mt-8">
          <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: "1px solid #e2e8f0" }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #0f2027, #163a3a)" }}>
              <div>
                <h2 className="font-semibold text-white text-sm tracking-wide uppercase">Transaction Ledger</h2>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{transactions.length} transactions recorded</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.1)" }}>
                <ArrowLeftRight className="w-4 h-4 text-white opacity-70" />
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="p-12 text-center bg-white">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#edf7f7" }}>
                  <ArrowLeftRight className="w-8 h-8" style={{ color: "#2a7c7c" }} />
                </div>
                <p className="text-gray-600 font-medium">No transactions yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto bg-white">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "#f8fffe" }}>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Product</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Type</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>From / To</th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Price</th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "#1d5c5c" }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx, i) => (
                      <tr key={i} className="transition-colors duration-150" style={{ borderBottom: "1px solid #f0f5f5" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "#f8fffe"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                      >
                        <td className="px-6 py-4 font-semibold" style={{ color: "#0f2027" }}>{tx.productName}</td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#edf7f7", color: "#1d5c5c" }}>{tx.type}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          <span className="font-medium" style={{ color: "#0f2027" }}>{tx.seller}</span>
                          <span className="mx-2" style={{ color: "#2a7c7c" }}>&rarr;</span>
                          <span className="font-medium" style={{ color: "#0f2027" }}>{tx.buyer}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold" style={{ color: "#0f2027" }}>${tx.price}</td>
                        <td className="px-6 py-4 text-xs text-gray-400">{new Date(tx.timestamp).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Track Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(15,32,39,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4" style={{ background: "linear-gradient(135deg, #0f2027, #163a3a)" }}>
              <h3 className="font-semibold text-white text-sm">Tracking: {modal.product.productName}</h3>
              <button onClick={() => setModal(null)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }}>
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="p-6"><TrackingTimeline productId={modal.product.blockchainId} product={modal.product} /></div>
          </div>
        </div>
      )}
    </div>
  );
}
