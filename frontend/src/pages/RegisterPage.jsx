import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import VideoHero from "../components/VideoHero";
import { Leaf, UserPlus, AlertCircle, Eye, EyeOff, Wallet, Phone, Building2, Globe, ChevronDown } from "lucide-react";

const ROLES = [
  { value: "farmer", label: "Farmer", emoji: "\u{1F468}\u200D\u{1F33E}" },
  { value: "processor", label: "Processor", emoji: "\u{1F3ED}" },
  { value: "roaster", label: "Roaster", emoji: "\u{1F525}" },
  { value: "manufacturer", label: "Manufacturer", emoji: "\u2699\uFE0F" },
  { value: "exporter", label: "Exporter", emoji: "\u{1F6A2}" },
  { value: "retailer", label: "Retailer", emoji: "\u{1F3EC}" },
  { value: "warehouse", label: "Warehouse", emoji: "\u{1F3E2}" },
  { value: "transporter", label: "Transporter", emoji: "\u{1F69A}" },
  { value: "admin", label: "Admin", emoji: "\u{1F6E1}\uFE0F" },
];

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

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your favourite food?",
  "What was your childhood nickname?",
  "What is the name of your first school?",
];

const inputClass = "w-full px-4 py-2.5 bg-white/[0.06] border border-white/[0.10] rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/50 transition";
const labelClass = "block text-[10px] font-semibold text-white/60 uppercase tracking-wider mb-1";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phone: { countryCode: "+1", number: "" },
    password: "",
    confirmPassword: "",
    role: "farmer",
    walletAddress: "",
    organization: "",
    country: "",
    securityQuestion1: SECURITY_QUESTIONS[0],
    securityAnswer1: "",
    securityQuestion2: SECURITY_QUESTIONS[1],
    securityAnswer2: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [step, setStep] = useState(1); // 1 = personal info, 2 = security & role

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleConnectWallet = async () => {
    if (!window.ethereum) { setError("MetaMask is not installed"); return; }
    setWalletConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setForm({ ...form, walletAddress: accounts[0] });
    } catch (err) { setError("Failed to connect wallet"); }
    finally { setWalletConnecting(false); }
  };

  const validateStep1 = () => {
    if (!form.firstName.trim()) return "First name is required";
    if (!form.lastName.trim()) return "Last name is required";
    if (!form.email.trim()) return "Email is required";
    if (!/\S+@\S+\.\S+/.test(form.email)) return "Please enter a valid email address";
    if (!form.phone.number.trim()) return "Phone number is required";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!form.securityAnswer1.trim() || !form.securityAnswer2.trim()) {
      setError("Please answer both security questions"); return;
    }
    setLoading(true);
    try {
      const fullName = [form.firstName, form.middleName, form.lastName].filter(Boolean).join(" ");
      register({
        fullName,
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        preferredRole: form.role,
        walletAddress: form.walletAddress,
        phone: form.phone,
        organization: form.organization,
        country: form.country,
        securityQuestions: [
          { question: form.securityQuestion1, answer: form.securityAnswer1.toLowerCase().trim() },
          { question: form.securityQuestion2, answer: form.securityAnswer2.toLowerCase().trim() },
        ],
      });
      navigate("/login");
    } catch (err) { setError(err.message || "Registration failed"); }
    finally { setLoading(false); }
  };

  return (
    <VideoHero page="register" fullScreen>
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#1d5c5c]/90 backdrop-blur-sm h-10 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="text-white/90 text-xs font-semibold tracking-[0.15em] uppercase">FairTrace</span>
        </div>
        <Link to="/login" className="text-white/70 hover:text-white text-xs font-medium uppercase tracking-wider transition">Login</Link>
      </div>

      <div className="w-full max-w-lg mx-auto mt-4">
        <div className="text-center mb-5">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight uppercase"
            style={{ fontFamily: "'Outfit', sans-serif", lineHeight: 1.1 }}>
            Become a<br />Verified Member
          </h1>
          <div className="w-14 h-[3px] bg-[#e8604c] mx-auto my-3" />
          <p className="text-white/50 text-xs">Join the fair trade supply chain network</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition ${step === 1 ? "bg-[#2a7c7c] text-white" : "bg-white/10 text-white/40"}`}>
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px]">1</span>
            Personal Info
          </div>
          <div className="w-6 h-px bg-white/20" />
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition ${step === 2 ? "bg-[#2a7c7c] text-white" : "bg-white/10 text-white/40"}`}>
            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px]">2</span>
            Security & Role
          </div>
        </div>

        <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.10] rounded-2xl p-6 shadow-2xl max-h-[68vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-3">

            {step === 1 && (
              <>
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>First Name <span className="text-[#e8604c]">*</span></label>
                    <input type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="John"
                      className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Middle Name <span className="text-white/25">(Optional)</span></label>
                    <input type="text" name="middleName" value={form.middleName} onChange={handleChange} placeholder="M."
                      className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Last Name <span className="text-[#e8604c]">*</span></label>
                  <input type="text" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Doe"
                    className={inputClass} />
                </div>

                {/* Email */}
                <div>
                  <label className={labelClass}>Email Address <span className="text-[#e8604c]">*</span></label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com"
                    className={inputClass} />
                </div>

                {/* Phone Number with country code */}
                <div>
                  <label className={labelClass}>Phone Number <span className="text-[#e8604c]">*</span></label>
                  <div className="flex gap-2">
                    <select
                      value={form.phone.countryCode}
                      onChange={(e) => setForm({ ...form, phone: { ...form.phone, countryCode: e.target.value } })}
                      className="w-28 px-2 py-2.5 bg-white/[0.06] border border-white/[0.10] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/50 transition appearance-none cursor-pointer"
                      style={{ backgroundImage: "none" }}>
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code} className="bg-[#1d5c5c] text-white">
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                    <input type="tel" value={form.phone.number}
                      onChange={(e) => setForm({ ...form, phone: { ...form.phone, number: e.target.value.replace(/[^0-9\s\-()]/g, "") } })}
                      placeholder="(555) 123-4567"
                      className={`flex-1 ${inputClass}`} />
                  </div>
                </div>

                {/* Organization & Country */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Organization <span className="text-white/25">(Optional)</span></label>
                    <input type="text" name="organization" value={form.organization} onChange={handleChange} placeholder="Company name"
                      className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Country <span className="text-white/25">(Optional)</span></label>
                    <input type="text" name="country" value={form.country} onChange={handleChange} placeholder="e.g. Kenya"
                      className={inputClass} />
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Password <span className="text-[#e8604c]">*</span></label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="6+ chars"
                        className={`${inputClass} pr-9`} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Confirm <span className="text-[#e8604c]">*</span></label>
                    <input type={showPassword ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Re-enter"
                      className={inputClass} />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-2.5 bg-[#e8604c]/15 border border-[#e8604c]/20 text-[#e8604c] rounded-lg text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                  </div>
                )}

                <button type="button" onClick={handleNext}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-lg transition shadow-lg active:scale-[0.98] text-sm uppercase tracking-wider">
                  Continue <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                {/* Security Questions */}
                <div>
                  <label className={labelClass}>Security Question 1 <span className="text-[#e8604c]">*</span></label>
                  <select name="securityQuestion1" value={form.securityQuestion1} onChange={handleChange}
                    className={`${inputClass} appearance-none cursor-pointer`}>
                    {SECURITY_QUESTIONS.map((q) => (
                      <option key={q} value={q} className="bg-[#1d5c5c] text-white">{q}</option>
                    ))}
                  </select>
                  <input type="text" name="securityAnswer1" value={form.securityAnswer1} onChange={handleChange}
                    placeholder="Your answer" className={`${inputClass} mt-1.5`} />
                </div>

                <div>
                  <label className={labelClass}>Security Question 2 <span className="text-[#e8604c]">*</span></label>
                  <select name="securityQuestion2" value={form.securityQuestion2} onChange={handleChange}
                    className={`${inputClass} appearance-none cursor-pointer`}>
                    {SECURITY_QUESTIONS.filter(q => q !== form.securityQuestion1).map((q) => (
                      <option key={q} value={q} className="bg-[#1d5c5c] text-white">{q}</option>
                    ))}
                  </select>
                  <input type="text" name="securityAnswer2" value={form.securityAnswer2} onChange={handleChange}
                    placeholder="Your answer" className={`${inputClass} mt-1.5`} />
                </div>

                {/* Wallet */}
                <div>
                  <label className={labelClass}>MetaMask <span className="text-white/25">(Optional)</span></label>
                  {form.walletAddress ? (
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-[#2a7c7c]/20 border border-[#2a7c7c]/30 rounded-lg">
                      <Wallet className="w-3.5 h-3.5 text-[#2a7c7c]" />
                      <span className="text-[#2a7c7c] text-xs font-mono truncate">{form.walletAddress}</span>
                    </div>
                  ) : (
                    <button type="button" onClick={handleConnectWallet} disabled={walletConnecting}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-[#e8604c]/15 border border-[#e8604c]/20 text-[#e8604c] rounded-lg text-xs hover:bg-[#e8604c]/25 transition disabled:opacity-50">
                      <Wallet className="w-3.5 h-3.5" />{walletConnecting ? "Connecting..." : "Connect MetaMask"}
                    </button>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className={labelClass + " mb-1.5"}>Preferred Role</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ROLES.map((role) => (
                      <button key={role.value} type="button" onClick={() => setForm({ ...form, role: role.value })}
                        className={`px-2 py-2 rounded-lg border text-center transition ${
                          form.role === role.value
                            ? "border-[#2a7c7c]/50 bg-[#2a7c7c]/20"
                            : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"
                        }`}>
                        <span className="text-base block">{role.emoji}</span>
                        <span className="text-[9px] font-medium text-white/70 block mt-0.5">{role.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-2.5 bg-[#e8604c]/15 border border-[#e8604c]/20 text-[#e8604c] rounded-lg text-xs">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{error}
                  </div>
                )}

                <div className="flex gap-2">
                  <button type="button" onClick={() => { setStep(1); setError(""); }}
                    className="px-5 py-3 border border-white/20 text-white/70 hover:text-white hover:border-white/40 font-semibold rounded-lg transition text-sm uppercase tracking-wider">
                    Back
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-lg transition shadow-lg disabled:opacity-60 active:scale-[0.98] text-sm uppercase tracking-wider">
                    <UserPlus className="w-4 h-4" />{loading ? "Creating..." : "Become a Member"}
                  </button>
                </div>
              </>
            )}
          </form>
          <div className="mt-4 text-center">
            <p className="text-white/30 text-xs">Already a member? <Link to="/login" className="text-[#e8604c] hover:text-[#e8604c]/80 font-semibold transition">Sign In</Link></p>
          </div>
        </div>
      </div>
    </VideoHero>
  );
}
