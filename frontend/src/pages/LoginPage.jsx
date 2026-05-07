import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import VideoHero from "../components/VideoHero";
import { Leaf, LogIn, AlertCircle, Eye, EyeOff, Wallet, KeyRound, ArrowLeft, CheckCircle, Shield } from "lucide-react";

export default function LoginPage() {
  const { login, loginWithWallet, getSecurityQuestions, resetPasswordWithQuestions } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(false); // show forgot password flow
  const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=questions, 3=new password, 4=success
  const [forgotEmail, setForgotEmail] = useState("");
  const [securityQuestions, setSecurityQuestions] = useState([]);
  const [securityAnswers, setSecurityAnswers] = useState(["", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [forgotError, setForgotError] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter both email and password"); return; }
    setLoading(true); setError("");
    try {
      const user = login(email, password);
      navigate(`/dashboard/${user.preferredRole || user.role}`);
    } catch (err) { setError(err.message || "Login failed"); }
    finally { setLoading(false); }
  };

  const handleWalletLogin = async () => {
    setWalletLoading(true); setError("");
    try {
      const user = await loginWithWallet();
      navigate(`/dashboard/${user.preferredRole || user.role}`);
    } catch (err) { setError(err.message || "Wallet login failed"); }
    finally { setWalletLoading(false); }
  };

  // Forgot password handlers
  const handleForgotEmailSubmit = () => {
    setForgotError("");
    if (!forgotEmail.trim()) { setForgotError("Please enter your email"); return; }
    try {
      const questions = getSecurityQuestions(forgotEmail);
      setSecurityQuestions(questions);
      setSecurityAnswers(questions.map(() => ""));
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message);
    }
  };

  const handleAnswersSubmit = () => {
    setForgotError("");
    if (securityAnswers.some(a => !a.trim())) {
      setForgotError("Please answer all security questions"); return;
    }
    setForgotStep(3);
  };

  const handleResetPassword = () => {
    setForgotError("");
    if (newPassword.length < 6) { setForgotError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmNewPassword) { setForgotError("Passwords do not match"); return; }
    try {
      resetPasswordWithQuestions(forgotEmail, securityAnswers, newPassword);
      setForgotStep(4);
    } catch (err) {
      setForgotError(err.message);
    }
  };

  const resetForgotFlow = () => {
    setForgotMode(false);
    setForgotStep(1);
    setForgotEmail("");
    setSecurityQuestions([]);
    setSecurityAnswers(["", ""]);
    setNewPassword("");
    setConfirmNewPassword("");
    setForgotError("");
  };

  const inputClass = "w-full px-4 py-3 bg-white/[0.06] border border-white/[0.10] rounded-lg text-white placeholder-white/25 text-sm focus:outline-none focus:ring-2 focus:ring-[#2a7c7c]/50 focus:border-[#2a7c7c]/50 transition";

  return (
    <VideoHero page="login" fullScreen>
      {/* WFTO-style top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#1d5c5c]/90 backdrop-blur-sm h-10 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="text-white/90 text-xs font-semibold tracking-[0.15em] uppercase">FairTrace</span>
        </div>
        <Link to="/register" className="text-white/70 hover:text-white text-xs font-medium uppercase tracking-wider transition">
          Register
        </Link>
      </div>

      <div className="w-full max-w-md mx-auto mt-8">
        {/* Hero Text */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight uppercase mb-2"
            style={{ fontFamily: "'Outfit', sans-serif", lineHeight: 1.1 }}>
            {forgotMode ? (forgotStep === 4 ? "Password\nReset" : "Forgot\nPassword") : "Welcome\nBack"}
          </h1>
          <div className="w-14 h-[3px] bg-[#e8604c] mx-auto my-4" />
          <p className="text-white/60 text-sm">
            {forgotMode
              ? forgotStep === 4 ? "Your password has been updated" : "Verify your identity to reset your password"
              : "Sign in to your fair trade supply chain account"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/[0.10] rounded-2xl p-7 shadow-2xl">

          {/* ===== NORMAL LOGIN ===== */}
          {!forgotMode && (
            <>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                    className={inputClass} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
                      className={`${inputClass} pr-11`} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Forgot Password link */}
                  <div className="flex justify-end mt-1.5">
                    <button type="button" onClick={() => setForgotMode(true)}
                      className="text-[11px] text-[#e8604c]/80 hover:text-[#e8604c] font-medium transition">
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-[#e8604c]/15 border border-[#e8604c]/20 text-[#e8604c] rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                  </div>
                )}

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-lg transition shadow-lg disabled:opacity-60 active:scale-[0.98] text-sm uppercase tracking-wider">
                  <LogIn className="w-4 h-4" />{loading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className="flex items-center gap-4 my-5">
                <div className="flex-1 h-px bg-white/[0.08]" />
                <span className="text-white/25 text-[10px] font-semibold uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-white/[0.08]" />
              </div>

              <button onClick={handleWalletLogin} disabled={walletLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#e8604c] hover:bg-[#d14e3a] text-white font-semibold rounded-lg transition shadow-lg disabled:opacity-60 active:scale-[0.98] text-sm">
                <Wallet className="w-4 h-4" />{walletLoading ? "Connecting..." : "Connect with MetaMask"}
              </button>

              <div className="mt-5 text-center">
                <p className="text-white/30 text-xs">Don't have an account?</p>
                <Link to="/register"
                  className="inline-block mt-2 px-6 py-2 border-2 border-white/20 text-white/80 hover:border-white/40 hover:text-white font-semibold rounded-full text-xs uppercase tracking-wider transition">
                  Create Account
                </Link>
              </div>
            </>
          )}

          {/* ===== FORGOT PASSWORD FLOW ===== */}
          {forgotMode && (
            <div className="space-y-4">

              {/* Step 1: Enter email */}
              {forgotStep === 1 && (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#e8604c]/20 flex items-center justify-center">
                      <KeyRound className="w-5 h-5 text-[#e8604c]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Step 1 of 3</p>
                      <p className="text-[11px] text-white/50">Enter your registered email</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="you@example.com" className={inputClass}
                      onKeyDown={(e) => e.key === "Enter" && handleForgotEmailSubmit()} />
                  </div>
                  {forgotError && (
                    <div className="flex items-center gap-2 p-3 bg-[#e8604c]/15 border border-[#e8604c]/20 text-[#e8604c] rounded-lg text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{forgotError}
                    </div>
                  )}
                  <button onClick={handleForgotEmailSubmit}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-lg transition shadow-lg text-sm uppercase tracking-wider">
                    <Shield className="w-4 h-4" /> Verify Identity
                  </button>
                </>
              )}

              {/* Step 2: Answer security questions */}
              {forgotStep === 2 && (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#2a7c7c]/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-[#2a7c7c]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Step 2 of 3</p>
                      <p className="text-[11px] text-white/50">Answer your security questions</p>
                    </div>
                  </div>
                  {securityQuestions.map((q, i) => (
                    <div key={i}>
                      <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1.5">
                        Question {i + 1}
                      </label>
                      <p className="text-white/90 text-sm mb-1.5">{q}</p>
                      <input type="text" value={securityAnswers[i]}
                        onChange={(e) => {
                          const updated = [...securityAnswers];
                          updated[i] = e.target.value;
                          setSecurityAnswers(updated);
                        }}
                        placeholder="Your answer" className={inputClass} />
                    </div>
                  ))}
                  {forgotError && (
                    <div className="flex items-center gap-2 p-3 bg-[#e8604c]/15 border border-[#e8604c]/20 text-[#e8604c] rounded-lg text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{forgotError}
                    </div>
                  )}
                  <button onClick={handleAnswersSubmit}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-lg transition shadow-lg text-sm uppercase tracking-wider">
                    Continue
                  </button>
                </>
              )}

              {/* Step 3: Set new password */}
              {forgotStep === 3 && (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-[#2a7c7c]/20 flex items-center justify-center">
                      <KeyRound className="w-5 h-5 text-[#2a7c7c]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Step 3 of 3</p>
                      <p className="text-[11px] text-white/50">Set your new password</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1.5">New Password</label>
                    <div className="relative">
                      <input type={showNewPw ? "text" : "password"} value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="6+ characters" className={`${inputClass} pr-11`} />
                      <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition">
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider mb-1.5">Confirm New Password</label>
                    <input type={showNewPw ? "text" : "password"} value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password" className={inputClass} />
                  </div>
                  {forgotError && (
                    <div className="flex items-center gap-2 p-3 bg-[#e8604c]/15 border border-[#e8604c]/20 text-[#e8604c] rounded-lg text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />{forgotError}
                    </div>
                  )}
                  <button onClick={handleResetPassword}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-lg transition shadow-lg text-sm uppercase tracking-wider">
                    <KeyRound className="w-4 h-4" /> Reset Password
                  </button>
                </>
              )}

              {/* Step 4: Success */}
              {forgotStep === 4 && (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Password Reset Successful</h3>
                  <p className="text-white/50 text-sm mb-5">You can now sign in with your new password</p>
                  <button onClick={resetForgotFlow}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2a7c7c] hover:bg-[#1d5c5c] text-white font-semibold rounded-lg transition shadow-lg text-sm uppercase tracking-wider">
                    <LogIn className="w-4 h-4" /> Back to Sign In
                  </button>
                </div>
              )}

              {/* Back to login link (not on success) */}
              {forgotStep !== 4 && (
                <button onClick={resetForgotFlow}
                  className="w-full flex items-center justify-center gap-2 mt-2 text-white/40 hover:text-white/70 text-sm transition">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-white/15 text-[10px] mt-6 uppercase tracking-wider">Powered by Ethereum / Polygon Blockchain</p>
      </div>
    </VideoHero>
  );
}
