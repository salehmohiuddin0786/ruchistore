"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, Lock, User, ArrowRight, ShieldCheck, ShoppingBag, Store, Bike, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function AuthModal({ isOpen, onClose }) {
  const router = useRouter();
  const { login, loginWithOtp, requestOtp, register } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("otp"); // "otp" | "password" | "register"
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

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

          <div className="mt-6 text-center text-xs text-slate-400">
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
