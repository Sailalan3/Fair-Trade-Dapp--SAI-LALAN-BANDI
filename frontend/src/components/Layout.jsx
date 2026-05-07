import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Leaf, ChevronDown, User, PlusCircle, Factory, Flame, Settings, Truck, Store, LayoutDashboard, Building2, FileText, Globe, Menu, X, QrCode, ShoppingCart, FolderOpen } from "lucide-react";
import { NotificationBell } from "./NotificationPanel";
import QRScanner from "./QRScanner";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [actOpen, setActOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const handleLogout = () => { logout(); navigate("/login"); };
  const role = user?.preferredRole || user?.role || "farmer";
  const dashboardPath = `/dashboard/${role}`;

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const NAV_LINKS = [
    { path: dashboardPath, label: "HOME", icon: LayoutDashboard },
    { path: "/products", label: "PRODUCTS", icon: Globe },
    { path: "/transactions", label: "TRANSACTIONS", icon: FileText },
    { path: "/receipts", label: "RECEIPTS", icon: FileText },
    { path: "/orders", label: "ORDERS", icon: ShoppingCart },
    { path: "/documents", label: "DOCS", icon: FolderOpen },
  ];

  const ACTIONS = [
    { path: "/products/add", label: "Register Product", icon: PlusCircle, desc: "Add new product to blockchain" },
    { path: "/dashboard/processor", label: "Process Product", icon: Factory, desc: "Process raw materials" },
    { path: "/dashboard/roaster", label: "Roast Product", icon: Flame, desc: "Roast coffee & goods" },
    { path: "/dashboard/manufacturer", label: "Manufacture", icon: Settings, desc: "Manufacturing & production" },
    { path: "/dashboard/exporter", label: "Export Product", icon: Truck, desc: "Global export & shipping" },
    { path: "/dashboard/warehouse", label: "Warehouse", icon: Building2, desc: "Store & dispatch inventory" },
    { path: "/dashboard/transporter", label: "Transport", icon: Truck, desc: "Local delivery & logistics" },
    { path: "/dashboard/retailer", label: "Sell Product", icon: Store, desc: "Retail & sell to consumers" },
  ];

  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col">
      {/* ═══ TOP BAR (WFTO-style dark teal utility bar) ═══ */}
      <div className="bg-[#1d5c5c] text-white/90 text-xs h-9 flex items-center justify-between px-6 z-50 relative">
        <div className="flex items-center gap-4">
          <span className="font-medium tracking-wider uppercase text-[10px]">Fair Trade Supply Chain</span>
          <span className="text-white/30">|</span>
          <span className="text-white/60 text-[10px]">Blockchain Verified</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-white/60 hidden md:inline text-[10px]">{user?.email}</span>
          <button onClick={handleLogout} className="flex items-center gap-1 text-white/70 hover:text-white transition text-[10px] font-medium uppercase tracking-wider">
            <LogOut className="w-3 h-3" /> Logout
          </button>
        </div>
      </div>

      {/* ═══ MAIN NAVBAR (WFTO-style white nav) ═══ */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200/80 shadow-sm">
        <div className="flex items-center justify-between px-6 h-16">
          {/* Logo */}
          <Link to={dashboardPath} className="flex items-center gap-3">
            <div className="w-11 h-11 bg-[#2a7c7c] rounded-full flex items-center justify-center shadow-sm">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#2c3e50] leading-none tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>FairTrace</h1>
              <p className="text-[9px] text-[#2a7c7c] font-semibold tracking-[0.2em] uppercase">Supply Chain DApp</p>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.path} to={link.path}
                className={`px-4 py-2 text-[13px] font-semibold tracking-wide uppercase transition-all border-b-2 ${
                  isActive(link.path)
                    ? "text-[#2a7c7c] border-[#2a7c7c]"
                    : "text-[#555] border-transparent hover:text-[#2a7c7c] hover:border-[#2a7c7c]/30"
                }`}>
                {link.label}
              </NavLink>
            ))}

            {/* Actions Dropdown */}
            <div className="relative ml-2">
              <button onClick={() => { setActOpen(!actOpen); setProfileOpen(false); }}
                className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold tracking-wide uppercase text-[#555] hover:text-[#2a7c7c] transition border-b-2 border-transparent">
                OUR ACTIONS <ChevronDown className={`w-3.5 h-3.5 transition-transform ${actOpen ? "rotate-180" : ""}`} />
              </button>
              {actOpen && (
                <div className="absolute top-full right-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-50">
                  {ACTIONS.map((act) => (
                    <Link key={act.label} to={act.path} onClick={() => setActOpen(false)}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-[#f5f3ee] transition group">
                      <div className="w-9 h-9 rounded-lg bg-[#e6f3f3] text-[#2a7c7c] flex items-center justify-center group-hover:bg-[#2a7c7c] group-hover:text-white transition">
                        <act.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-[#2c3e50] block">{act.label}</span>
                        <span className="text-[11px] text-gray-400">{act.desc}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right side: CTA + Profile */}
          <div className="flex items-center gap-3">
            {/* CTA Button (WFTO coral style) */}
            <Link to="/products/add" className="hidden md:flex items-center gap-1.5 px-5 py-2 bg-[#e8604c] hover:bg-[#d14e3a] text-white text-sm font-semibold rounded-full transition shadow-sm active:scale-[0.97]">
              Register Product
            </Link>

            {/* QR Scanner */}
            <button onClick={() => setQrOpen(true)}
              className="p-2 text-[#2c3e50]/60 hover:text-[#2a7c7c] transition rounded-lg hover:bg-[#f5f3ee]"
              title="Scan QR Code">
              <QrCode className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* Profile */}
            <div className="relative">
              <button onClick={() => { setProfileOpen(!profileOpen); setActOpen(false); }}
                className="flex items-center gap-2.5 py-1 focus:outline-none">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-bold text-[#2c3e50] leading-tight">{user?.fullName}</p>
                  <p className="text-[10px] text-[#2a7c7c] font-semibold capitalize">{role}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#e6f3f3] text-[#2a7c7c] flex items-center justify-center text-sm font-bold border-2 border-[#2a7c7c]/20 hover:border-[#2a7c7c]/50 transition">
                  {user?.fullName?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                </div>
              </button>
              {profileOpen && (
                <div className="absolute top-full right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-5 py-3 border-b border-gray-100 mb-1">
                    <p className="text-sm font-bold text-[#2c3e50]">{user?.fullName}</p>
                    <p className="text-xs text-[#2a7c7c] capitalize font-medium">{role}</p>
                    {user?.email && <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>}
                  </div>
                  <Link to={dashboardPath} onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-5 py-2.5 text-sm text-[#2c3e50] hover:bg-[#f5f3ee] transition">
                    <LayoutDashboard className="w-4 h-4 text-[#2a7c7c]" /> My Dashboard
                  </Link>
                  <Link to="/receipts" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-5 py-2.5 text-sm text-[#2c3e50] hover:bg-[#f5f3ee] transition">
                    <FileText className="w-4 h-4 text-[#2a7c7c]" /> My Receipts
                  </Link>
                  <Link to="/orders" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-5 py-2.5 text-sm text-[#2c3e50] hover:bg-[#f5f3ee] transition">
                    <ShoppingCart className="w-4 h-4 text-[#2a7c7c]" /> My Orders
                  </Link>
                  <Link to="/documents" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-5 py-2.5 text-sm text-[#2c3e50] hover:bg-[#f5f3ee] transition">
                    <FolderOpen className="w-4 h-4 text-[#2a7c7c]" /> Documents
                  </Link>
                  <Link to="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-5 py-2.5 text-sm text-[#2c3e50] hover:bg-[#f5f3ee] transition">
                    <Settings className="w-4 h-4 text-[#2a7c7c]" /> Account Settings
                  </Link>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={handleLogout} className="flex items-center gap-2 w-full px-5 py-2.5 text-sm font-medium text-[#e8604c] hover:bg-red-50 transition">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-[#2c3e50] hover:bg-gray-100 rounded-lg">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-3 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
                className={`block px-4 py-2.5 text-sm font-semibold rounded-lg ${isActive(link.path) ? "bg-[#e6f3f3] text-[#2a7c7c]" : "text-[#555] hover:bg-gray-50"}`}>
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-2">
              <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider px-4 mb-1">Actions</p>
              {ACTIONS.map((act) => (
                <Link key={act.label} to={act.path} onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[#2c3e50] hover:bg-gray-50 rounded-lg">
                  <act.icon className="w-4 h-4 text-[#2a7c7c]" /> {act.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Click-away overlay */}
      {(actOpen || profileOpen) && (
        <div className="fixed inset-0 z-40" onClick={() => { setActOpen(false); setProfileOpen(false); }} />
      )}

      {/* Main Content */}
      <main className="flex-1 w-full relative z-10">
        <div className="w-full p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* ═══ FOOTER (WFTO-style) ═══ */}
      <footer className="bg-[#1d5c5c] text-white/80 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-2">Product Labels</h3>
              <p className="text-[11px] text-white/50">Guaranteed Fair Trade Certified</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-2">10 Principles of Fair Trade</h3>
              <p className="text-[11px] text-white/50">Transparency &middot; Equity &middot; Sustainability</p>
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-2">Verified Member Search</h3>
              <p className="text-[11px] text-white/50">Source Fair Trade Products</p>
            </div>
          </div>
          <div className="border-t border-white/10 mt-6 pt-4 text-center">
            <p className="text-[10px] text-white/30">Powered by <span className="font-bold text-white/50">FairTrace</span> &middot; Ethereum / Polygon Blockchain &middot; &copy; 2026</p>
          </div>
        </div>
      </footer>

      {/* QR Scanner Modal */}
      {qrOpen && <QRScanner onClose={() => setQrOpen(false)} />}
    </div>
  );
}
