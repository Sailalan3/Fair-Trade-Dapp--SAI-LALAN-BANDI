import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Lock, Phone, Building2, Globe, Eye, EyeOff, Save, CheckCircle, AlertCircle, ChevronRight, Wallet, Shield, Star, Award, TrendingUp, Clock, Activity } from "lucide-react";
import { getUserReputation, getRatings } from "../utils/reputation";
import { getLoginHistory, getActivityLogs, ACTIVITY_ICONS } from "../utils/activityLog";

const COUNTRY_CODES = [
  { code: "+1", country: "US", flag: "\u{1F1FA}\u{1F1F8}" },
  { code: "+44", country: "UK", flag: "\u{1F1EC}\u{1F1E7}" },
  { code: "+91", country: "IN", flag: "\u{1F1EE}\u{1F1F3}" },
  { code: "+49", country: "DE", flag: "\u{1F1E9}\u{1F1EA}" },
  { code: "+33", country: "FR", flag: "\u{1F1EB}\u{1F1F7}" },
  { code: "+81", country: "JP", flag: "\u{1F1EF}\u{1F1F5}" },
  { code: "+86", country: "CN", flag: "\u{1F1E8}\u{1F1F3}" },
  { code: "+55", country: "BR", flag: "\u{1F1E7}\u{1F1F7}" },
  { code: "+61", country: "AU", flag: "\u{1F1E6}\u{1F1FA}" },
  { code: "+234", country: "NG", flag: "\u{1F1F3}\u{1F1EC}" },
  { code: "+254", country: "KE", flag: "\u{1F1F0}\u{1F1EA}" },
  { code: "+27", country: "ZA", flag: "\u{1F1FF}\u{1F1E6}" },
  { code: "+62", country: "ID", flag: "\u{1F1EE}\u{1F1E9}" },
  { code: "+84", country: "VN", flag: "\u{1F1FB}\u{1F1F3}" },
  { code: "+57", country: "CO", flag: "\u{1F1E8}\u{1F1F4}" },
  { code: "+51", country: "PE", flag: "\u{1F1F5}\u{1F1EA}" },
  { code: "+94", country: "LK", flag: "\u{1F1F1}\u{1F1F0}" },
  { code: "+880", country: "BD", flag: "\u{1F1E7}\u{1F1E9}" },
  { code: "+63", country: "PH", flag: "\u{1F1F5}\u{1F1ED}" },
  { code: "+66", country: "TH", flag: "\u{1F1F9}\u{1F1ED}" },
];

const inputClass = "w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-[#2c3e50] placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30 focus:border-[#2a7c7c] transition";
const labelClass = "block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5";

export default function SettingsPage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form
  const [profile, setProfile] = useState({
    firstName: user?.firstName || "",
    middleName: user?.middleName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || { countryCode: "+1", number: "" },
    organization: user?.organization || "",
    country: user?.country || "",
  });
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // Password form
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  const handleProfileSave = () => {
    setProfileMsg({ type: "", text: "" });
    if (!profile.firstName.trim() || !profile.lastName.trim()) {
      setProfileMsg({ type: "error", text: "First and last name are required" }); return;
    }
    try {
      updateProfile({
        firstName: profile.firstName,
        middleName: profile.middleName,
        lastName: profile.lastName,
        phone: profile.phone,
        organization: profile.organization,
        country: profile.country,
      });
      setProfileMsg({ type: "success", text: "Profile updated successfully" });
      setTimeout(() => setProfileMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setProfileMsg({ type: "error", text: err.message });
    }
  };

  const handlePasswordChange = () => {
    setPwMsg({ type: "", text: "" });
    if (!passwords.current) { setPwMsg({ type: "error", text: "Enter your current password" }); return; }
    if (passwords.new.length < 6) { setPwMsg({ type: "error", text: "New password must be at least 6 characters" }); return; }
    if (passwords.new !== passwords.confirm) { setPwMsg({ type: "error", text: "New passwords do not match" }); return; }
    try {
      changePassword(passwords.current, passwords.new);
      setPasswords({ current: "", new: "", confirm: "" });
      setPwMsg({ type: "success", text: "Password changed successfully" });
      setTimeout(() => setPwMsg({ type: "", text: "" }), 3000);
    } catch (err) {
      setPwMsg({ type: "error", text: err.message });
    }
  };

  const tabs = [
    { id: "profile", label: "Personal Info", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "reputation", label: "Reputation", icon: Star },
    { id: "activity", label: "Activity Log", icon: Activity },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#2c3e50]" style={{ fontFamily: "'Outfit', sans-serif" }}>Account Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal information and security</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-56 flex-shrink-0">
          {/* User card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#e6f3f3] text-[#2a7c7c] flex items-center justify-center text-2xl font-bold mx-auto mb-3 border-2 border-[#2a7c7c]/20">
              {user?.fullName?.[0]?.toUpperCase() || "U"}
            </div>
            <p className="text-sm font-bold text-[#2c3e50]">{user?.fullName}</p>
            <p className="text-xs text-[#2a7c7c] capitalize font-medium">{user?.preferredRole || user?.role}</p>
            {user?.email && <p className="text-[11px] text-gray-400 mt-1 truncate">{user.email}</p>}
          </div>

          {/* Tab navigation */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition border-b border-gray-100 last:border-0 ${
                  activeTab === tab.id
                    ? "bg-[#e6f3f3] text-[#2a7c7c]"
                    : "text-gray-600 hover:bg-gray-50"
                }`}>
                <tab.icon className="w-4 h-4" />
                {tab.label}
                <ChevronRight className={`w-3.5 h-3.5 ml-auto transition ${activeTab === tab.id ? "text-[#2a7c7c]" : "text-gray-300"}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {activeTab === "profile" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-[#2c3e50]">Personal Information</h2>
                <p className="text-xs text-gray-400 mt-0.5">Update your name, phone, and other details</p>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>First Name</label>
                    <input type="text" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      placeholder="John" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Middle Name <span className="text-gray-300">(Optional)</span></label>
                    <input type="text" value={profile.middleName} onChange={(e) => setProfile({ ...profile, middleName: e.target.value })}
                      placeholder="M." className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Last Name</label>
                  <input type="text" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    placeholder="Doe" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Email Address</label>
                  <input type="email" value={profile.email} disabled
                    className={`${inputClass} bg-gray-50 text-gray-400 cursor-not-allowed`} />
                  <p className="text-[10px] text-gray-400 mt-1">Email cannot be changed</p>
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <div className="flex gap-2">
                    <select value={profile.phone.countryCode}
                      onChange={(e) => setProfile({ ...profile, phone: { ...profile.phone, countryCode: e.target.value } })}
                      className="w-28 px-2 py-2.5 bg-white border border-gray-200 rounded-lg text-[#2c3e50] text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/30 transition">
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                      ))}
                    </select>
                    <input type="tel" value={profile.phone.number}
                      onChange={(e) => setProfile({ ...profile, phone: { ...profile.phone, number: e.target.value.replace(/[^0-9\s\-()]/g, "") } })}
                      placeholder="(555) 123-4567" className={`flex-1 ${inputClass}`} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Organization <span className="text-gray-300">(Optional)</span></label>
                    <input type="text" value={profile.organization} onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                      placeholder="Company name" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Country <span className="text-gray-300">(Optional)</span></label>
                    <input type="text" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                      placeholder="e.g. Kenya" className={inputClass} />
                  </div>
                </div>

                {/* Wallet info (read-only) */}
                {user?.walletAddress && (
                  <div>
                    <label className={labelClass}>Wallet Address</label>
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#e6f3f3] border border-[#2a7c7c]/20 rounded-lg">
                      <Wallet className="w-4 h-4 text-[#2a7c7c]" />
                      <span className="text-[#2a7c7c] text-sm font-mono truncate">{user.walletAddress}</span>
                    </div>
                  </div>
                )}

                {profileMsg.text && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                    profileMsg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"
                  }`}>
                    {profileMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {profileMsg.text}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button onClick={handleProfileSave}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-lg transition shadow-sm text-sm">
                    <Save className="w-4 h-4" /> Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "password" && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-[#2c3e50]">Change Password</h2>
                <p className="text-xs text-gray-400 mt-0.5">Update your password to keep your account secure</p>
              </div>
              <div className="p-6 space-y-4 max-w-md">
                <div>
                  <label className={labelClass}>Current Password</label>
                  <div className="relative">
                    <input type={showPw.current ? "text" : "password"} value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      placeholder="Enter current password" className={`${inputClass} pr-10`} />
                    <button type="button" onClick={() => setShowPw({ ...showPw, current: !showPw.current })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>New Password</label>
                  <div className="relative">
                    <input type={showPw.new ? "text" : "password"} value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      placeholder="6+ characters" className={`${inputClass} pr-10`} />
                    <button type="button" onClick={() => setShowPw({ ...showPw, new: !showPw.new })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirm New Password</label>
                  <div className="relative">
                    <input type={showPw.confirm ? "text" : "password"} value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="Re-enter new password" className={`${inputClass} pr-10`} />
                    <button type="button" onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {pwMsg.text && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                    pwMsg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"
                  }`}>
                    {pwMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {pwMsg.text}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button onClick={handlePasswordChange}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-lg transition shadow-sm text-sm">
                    <Lock className="w-4 h-4" /> Update Password
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ REPUTATION TAB ═══ */}
          {activeTab === "reputation" && (() => {
            const rep = getUserReputation(user?.email);
            if (!rep) return <p className="text-sm text-gray-400">Loading...</p>;
            const ratings = getRatings(user?.email);
            return (
              <div className="space-y-6">
                {/* Trust Score Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-[#2c3e50] mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#2a7c7c]" /> Trust Score & Level
                  </h3>
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Score Circle */}
                    <div className="relative w-32 h-32 flex-shrink-0">
                      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="#e6f3f3" strokeWidth="10" />
                        <circle cx="60" cy="60" r="52" fill="none" stroke="#2a7c7c" strokeWidth="10"
                          strokeDasharray={`${(rep.trustScore / 100) * 327} 327`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-extrabold text-[#2c3e50]">{rep.trustScore}</span>
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">Trust</span>
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold mb-3 ${
                        rep.level === "Platinum Trader" ? "bg-purple-100 text-purple-700" :
                        rep.level === "Gold Trader" ? "bg-yellow-100 text-yellow-700" :
                        rep.level === "Silver Trader" ? "bg-gray-100 text-gray-600" :
                        rep.level === "Bronze Trader" ? "bg-orange-100 text-orange-700" :
                        "bg-[#e6f3f3] text-[#2a7c7c]"
                      }`}>
                        {rep.level}
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-[#f5f3ee] rounded-lg p-3">
                          <p className="text-[10px] text-gray-400 uppercase">Transactions</p>
                          <p className="text-lg font-bold text-[#2c3e50]">{rep.totalTransactions}</p>
                        </div>
                        <div className="bg-[#f5f3ee] rounded-lg p-3">
                          <p className="text-[10px] text-gray-400 uppercase">Products</p>
                          <p className="text-lg font-bold text-[#2c3e50]">{rep.totalProducts}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating Summary */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-[#2c3e50] mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" /> Rating & Reviews
                  </h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-4xl font-extrabold text-[#2c3e50]">{rep.avgRating.toFixed(1)}</p>
                      <div className="flex gap-0.5 justify-center mt-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={`w-4 h-4 ${s <= Math.round(rep.avgRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{rep.ratingCount} review{rep.ratingCount !== 1 ? "s" : ""}</p>
                    </div>
                    {/* Rating Breakdown */}
                    <div className="flex-1 space-y-1.5">
                      {[5,4,3,2,1].map(s => {
                        const count = (ratings || []).filter(r => r.rating === s).length;
                        const pct = rep.ratingCount > 0 ? (count / rep.ratingCount) * 100 : 0;
                        return (
                          <div key={s} className="flex items-center gap-2 text-xs">
                            <span className="w-3 text-gray-500">{s}</span>
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-5 text-gray-400 text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Reviews */}
                  {ratings && ratings.length > 0 ? (
                    <div className="border-t border-gray-100 pt-4 space-y-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent Reviews</p>
                      {ratings.slice(0, 5).map((r, i) => (
                        <div key={i} className="flex items-start gap-3 bg-[#f5f3ee] rounded-lg p-3">
                          <div className="w-8 h-8 rounded-full bg-[#e6f3f3] text-[#2a7c7c] flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {r.raterEmail?.[0]?.toUpperCase() || "?"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-[#2c3e50]">{r.raterEmail}</span>
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(s => (
                                  <Star key={s} className={`w-2.5 h-2.5 ${s <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                                ))}
                              </div>
                            </div>
                            {r.comment && <p className="text-xs text-gray-500 mt-0.5">{r.comment}</p>}
                            <p className="text-[10px] text-gray-400 mt-1">{new Date(r.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-[#f5f3ee] rounded-lg">
                      <Star className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No reviews yet</p>
                      <p className="text-[10px] text-gray-400">Reviews appear here when other users rate your transactions</p>
                    </div>
                  )}
                </div>

                {/* Reputation Breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-base font-bold text-[#2c3e50] mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#2a7c7c]" /> Score Breakdown
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Transaction Volume", value: Math.min(rep.totalTransactions * 2, 20), max: 20, desc: `${rep.totalTransactions} transactions (max +20)` },
                      { label: "Product Portfolio", value: Math.min(rep.totalProducts, 10), max: 10, desc: `${rep.totalProducts} products (max +10)` },
                      { label: "User Rating", value: Math.min(Math.round(rep.avgRating * 3), 15), max: 15, desc: `${rep.avgRating.toFixed(1)}/5 average (max +15)` },
                      { label: "Base Trust", value: 50, max: 50, desc: "Starting trust baseline" },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-semibold text-[#2c3e50]">{item.label}</span>
                          <span className="text-[#2a7c7c] font-bold">+{item.value}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#2a7c7c] rounded-full transition-all" style={{ width: `${(item.value / item.max) * 100}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ═══ ACTIVITY LOG TAB ═══ */}
          {activeTab === "activity" && (() => {
            const logins = getLoginHistory(user?.email);
            const activities = getActivityLogs(user?.email, 50);
            return (
              <div className="space-y-6">
                {/* Login History */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-[#2c3e50] flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#2a7c7c]" /> Login History
                    </h3>
                  </div>
                  {logins.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No login history recorded yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-[#f5f3ee] text-left">
                            <th className="px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                            <th className="px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                            <th className="px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-5 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Platform</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {logins.slice(0, 10).map((login, i) => (
                            <tr key={i} className="hover:bg-[#f5f3ee]/50 transition">
                              <td className="px-5 py-3 text-xs text-[#2c3e50]">
                                {new Date(login.timestamp).toLocaleString()}
                              </td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  login.method === "wallet" ? "bg-purple-50 text-purple-600" : "bg-[#e6f3f3] text-[#2a7c7c]"
                                }`}>
                                  {login.method === "wallet" ? <Wallet className="w-2.5 h-2.5" /> : <Shield className="w-2.5 h-2.5" />}
                                  {login.method === "wallet" ? "MetaMask" : "Email"}
                                </span>
                              </td>
                              <td className="px-5 py-3">
                                <span className={`inline-block w-2 h-2 rounded-full ${login.success ? "bg-green-400" : "bg-red-400"}`} />
                                <span className="ml-1.5 text-xs text-gray-600">{login.success ? "Success" : "Failed"}</span>
                              </td>
                              <td className="px-5 py-3 text-xs text-gray-400 truncate max-w-[200px]">
                                {login.platform || "Unknown"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-base font-bold text-[#2c3e50] flex items-center gap-2">
                      <Activity className="w-5 h-5 text-[#2a7c7c]" /> Recent Activity
                    </h3>
                  </div>
                  {activities.length === 0 ? (
                    <div className="text-center py-8">
                      <Activity className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No activity recorded yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {activities.map((act, i) => {
                        const icon = ACTIVITY_ICONS[act.type] || "📋";
                        const timeDiff = Date.now() - new Date(act.timestamp).getTime();
                        const mins = Math.floor(timeDiff / 60000);
                        const hours = Math.floor(mins / 60);
                        const days = Math.floor(hours / 24);
                        const timeAgo = days > 0 ? `${days}d ago` : hours > 0 ? `${hours}h ago` : mins > 0 ? `${mins}m ago` : "Just now";
                        return (
                          <div key={i} className="flex items-start gap-3 px-6 py-3.5 hover:bg-[#f5f3ee]/50 transition">
                            <div className="w-9 h-9 rounded-lg bg-[#e6f3f3] flex items-center justify-center text-base flex-shrink-0">
                              {icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#2c3e50] font-medium">{act.description}</p>
                              {act.details && (
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {Object.entries(act.details).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">{timeAgo}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
