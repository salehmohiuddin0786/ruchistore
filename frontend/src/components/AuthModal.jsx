"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, Lock, User, ArrowRight, ShieldCheck, ShoppingBag, Store, Bike, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function AuthModal({ isOpen, onClose }) {
  const router = useRouter();
  const { login, loginWithOtp, loginWithGoogle, requestOtp, register } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("otp"); // "otp" | "password" | "register"
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Email / Password Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  if (!isOpen) return null;

  // Handle Request OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      showToast("Please enter a valid 10-digit mobile number", "error");
      return;
    }
    setLoading(true);
    const res = await requestOtp(phone);
    setLoading(false);
    if (res.success) {
      setOtpSent(true);
      showToast("Verification code sent! (Check dev console if in local testing)", "info");
    } else {
      showToast(res.message, "error");
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      showToast("Please enter the verification code", "error");
      return;
    }
    setLoading(true);
    const res = await loginWithOtp(phone, otp, name);
    setLoading(false);
    if (res.success) {
      showToast(`Welcome to Ruchi Store, ${res.user.name}!`);
      onClose();
    } else {
      showToast(res.message, "error");
    }
  };

  // Handle Password Login
  // Handle Password Login
  const handlePasswordLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!email || !password) {
      showToast("Please fill in email/username and password", "error");
      return;
    }
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      showToast(`Welcome back, ${res.user.name}!`);
      onClose();
      if (res.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (res.user.role === "SHOP_OWNER") {
        router.push("/shop-owner/dashboard");
      } else if (res.user.role === "DELIVERY_PARTNER") {
        router.push("/delivery/dashboard");
      }
    } else {
      showToast(res.message, "error");
    }
  };

  const handleQuickFill = (quickEmail, quickPassword, roleName) => {
    setActiveTab("password");
    setEmail(quickEmail);
    setPassword(quickPassword);
    showToast(`Loaded ${roleName} credentials! Click 'Sign In'.`);
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const res = await loginWithGoogle();
    setGoogleLoading(false);
    if (res.success) {
      showToast(`Welcome to Ruchi Store, ${res.user.name}!`);
      onClose();
      if (res.user.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (res.user.role === "SHOP_OWNER") {
        router.push("/shop-owner/dashboard");
      } else if (res.user.role === "DELIVERY_PARTNER") {
        router.push("/delivery/dashboard");
      }
    } else {
      showToast(res.message, "error");
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !phone || !password) {
      showToast("Name, mobile number, and password are required", "error");
      return;
    }
    setLoading(true);
    const res = await register({ name, email, phone, password });
    setLoading(false);
    if (res.success) {
      showToast("Registration successful! Welcome to Ruchi Store.");
      onClose();
    } else {
      showToast(res.message, "error");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 z-10 overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Brand Heading */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">RUCHI STORE</h2>
              <p className="text-xs text-slate-500 font-medium">Groceries delivered in 10-15 minutes</p>
            </div>
          </div>

          {/* Quick Demo Credentials Switcher */}
          <div className="mb-5 bg-slate-50 border border-slate-200/80 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                Demo Credentials (Pass: Admin@123)
              </span>
              <span className="text-[10px] text-indigo-600 font-bold">1-Click Fill</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill("admin@store", "Admin@123", "SuperAdmin")}
                className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-bold text-slate-800 leading-none text-xs">SuperAdmin</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">admin@store</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("owner@store", "Admin@123", "Shop Owner")}
                className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200/90 hover:border-purple-400 hover:bg-purple-50/40 text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-bold text-slate-800 leading-none text-xs">Shop Owner</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">owner@store</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("delivery@store", "Admin@123", "Delivery Partner")}
                className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Bike className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-bold text-slate-800 leading-none text-xs">Delivery</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">delivery@store</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("customer@store", "Admin@123", "Customer")}
                className="flex items-center gap-2 p-2 rounded-xl bg-white border border-slate-200/90 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all cursor-pointer shadow-2xs"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <p className="font-bold text-slate-800 leading-none text-xs">Customer</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">customer@store</p>
                </div>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 text-xs font-bold text-slate-600">
            <button
              onClick={() => {
                setActiveTab("otp");
                setOtpSent(false);
              }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === "otp" ? "bg-white text-indigo-600 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Phone OTP
            </button>
            <button
              onClick={() => setActiveTab("password")}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === "password" ? "bg-white text-indigo-600 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Password Login
            </button>
            <button
              onClick={() => setActiveTab("register")}
              className={`flex-1 py-2 rounded-xl transition-all ${
                activeTab === "register" ? "bg-white text-indigo-600 shadow-xs" : "hover:text-slate-900"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* TAB 1: PHONE OTP */}
          {activeTab === "otp" && (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-sm font-bold text-slate-500">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="Enter 10-digit mobile number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                        className="w-full pl-14 pr-4 py-3 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm font-semibold text-slate-900 outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || phone.length < 10}
                    className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Sending Code..." : "Continue with OTP"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="text-center pb-2">
                    <p className="text-xs text-slate-500">
                      Enter the 6-digit code sent to <strong>+91 {phone}</strong>
                    </p>
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="text-xs text-indigo-600 font-bold hover:underline mt-1"
                    >
                      Change Number
                    </button>
                  </div>

                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      className="w-full text-center tracking-[0.5em] py-3 text-lg font-black rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-hidden"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.length < 4}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {loading ? "Verifying..." : "Verify & Start Shopping"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: PASSWORD LOGIN */}
          {activeTab === "password" && (
            <form onSubmit={handlePasswordLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email / Username
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="text"
                    placeholder="e.g. admin@store or email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          {/* TAB 3: SIGN UP */}
          {activeTab === "register" && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mobile Number
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email (Optional)
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Create Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-900 outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}

          {/* Google Sign-In Divider & Button */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60"
          >
            {googleLoading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin text-slate-600" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Connecting with Google...
              </span>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          <div className="mt-5 text-center text-xs text-slate-400">
            By continuing, you agree to Ruchi Store's{" "}
            <a href="/terms-and-conditions" className="text-indigo-600 hover:underline">
              Terms of Service
            </a>{" "}
            &amp;{" "}
            <a href="/privacy-policy" className="text-indigo-600 hover:underline">
              Privacy Policy
            </a>.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
