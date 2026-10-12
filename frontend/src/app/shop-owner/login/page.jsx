"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  ArrowLeft,
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";
import PendingApprovalCard from "../../../components/PendingApprovalCard";

export default function ShopOwnerLoginPage() {
  const router = useRouter();
  const { login, logout, user, isAuthenticated, isShopOwner } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("login"); // "login" | "register"

  // Login fields
  const [email, setEmail] = useState("owner@store");
  const [password, setPassword] = useState("Admin@123");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register fields
  const [regData, setRegData] = useState({
    shopName: "",
    ownerName: "",
    phone: "",
    email: "",
    password: "",
    shopAddress: "",
    city: "Hyderabad",
    pincode: "500081",
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [pendingDetails, setPendingDetails] = useState(null);

  // If already authenticated and pending approval
  if (isAuthenticated && isShopOwner) {
    if (user?.shopStatus === "PENDING") {
      return (
        <PendingApprovalCard
          type="SHOP_OWNER"
          userName={user.name}
          entityName={user.name + "'s Store"}
          onRefresh={() => window.location.reload()}
          onLogout={logout}
        />
      );
    }
  }

  if (isPending) {
    return (
      <PendingApprovalCard
        type="SHOP_OWNER"
        userName={pendingDetails?.ownerName}
        entityName={pendingDetails?.shopName}
        onRefresh={() => router.push("/shop-owner/dashboard")}
        onLogout={() => setIsPending(false)}
      />
    );
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await login(email, password);
      if (!res?.success) {
        setLoginError(res?.message || "Invalid credentials.");
        return;
      }

      if (res.user?.role !== "SHOP_OWNER" && res.user?.role !== "ADMIN") {
        setLoginError("This account does not have Shop Owner permissions.");
        return;
      }

      if (res.user?.shopStatus === "PENDING") {
        setIsPending(true);
        setPendingDetails({
          ownerName: res.user.name,
          shopName: "Your Store",
        });
        return;
      }

      showToast("Signed in to Shop Owner Portal", "success");
      router.push("/shop-owner/dashboard");
    } catch (err) {
      setLoginError(err.response?.data?.message || err.message || "Failed to sign in");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError("");

    if (!regData.shopName || !regData.ownerName || !regData.phone || !regData.password) {
      setRegError("Please fill all required fields");
      setRegLoading(false);
      return;
    }

    try {
      const res = await apiClient.post("/auth/register-shop", regData);
      if (res.data?.success) {
        showToast("Registration submitted for review!", "success");
        setIsPending(true);
        setPendingDetails({
          ownerName: regData.ownerName,
          shopName: regData.shopName,
        });
      }
    } catch (err) {
      setRegError(err.response?.data?.message || "Failed to submit registration");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-600/30">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Shop Owner Portal</h1>
            <p className="text-xs text-slate-400">Ruchi Mart Store Management</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-800 rounded-2xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "login"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("register")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "register"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Register Partner Store
          </button>
        </div>

        {/* SIGN IN TAB */}
        {activeTab === "login" ? (
          <>
            {/* Quick Demo Credentials */}
            <div className="bg-purple-950/40 border border-purple-800/40 rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="font-bold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Demo Owner Credentials
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("owner@store");
                    setPassword("Admin@123");
                  }}
                  className="px-2 py-0.5 rounded-lg bg-purple-800 text-purple-200 text-[10px] font-bold hover:bg-purple-700 cursor-pointer"
                >
                  Autofill
                </button>
              </div>
              <p className="text-slate-300 font-mono">
                Email: <strong className="text-white">owner@store</strong>
              </p>
              <p className="text-slate-300 font-mono">
                Pass: <strong className="text-white">Admin@123</strong>
              </p>
            </div>

            {loginError && (
              <p className="text-xs font-semibold text-rose-400 bg-rose-950/50 p-3 rounded-xl border border-rose-800/50">
                {loginError}
              </p>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Owner Username / Email
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@store"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm outline-hidden focus:border-purple-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm outline-hidden focus:border-purple-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? "Authenticating..." : "Sign In to Shop Owner Portal"}
              </button>
            </form>
          </>
        ) : (
          /* REGISTER TAB */
          <form onSubmit={handleRegister} className="space-y-3.5">
            {regError && (
              <p className="text-xs font-semibold text-rose-400 bg-rose-950/50 p-3 rounded-xl border border-rose-800/50">
                {regError}
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Store / Supermarket Name *</label>
              <input
                type="text"
                value={regData.shopName}
                onChange={(e) => setRegData({ ...regData, shopName: e.target.value })}
                placeholder="e.g. Hyderabad Fresh Mart"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-purple-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Owner Name *</label>
                <input
                  type="text"
                  value={regData.ownerName}
                  onChange={(e) => setRegData({ ...regData, ownerName: e.target.value })}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-purple-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mobile (10 digits) *</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value.replace(/\D/g, "") })}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-purple-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  placeholder="shop@store.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  placeholder="Create password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-purple-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Store Address *</label>
              <input
                type="text"
                value={regData.shopAddress}
                onChange={(e) => setRegData({ ...regData, shopAddress: e.target.value })}
                placeholder="Shop No, Street, Locality"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-purple-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={regData.city}
                  onChange={(e) => setRegData({ ...regData, city: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-purple-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Pincode</label>
                <input
                  type="text"
                  maxLength={6}
                  value={regData.pincode}
                  onChange={(e) => setRegData({ ...regData, pincode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-purple-400"
                />
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 text-[11px] text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>After submission, your store will be verified by the admin before going live.</span>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {regLoading ? "Submitting Application..." : "Submit Store for Admin Approval"}
            </button>
          </form>
        )}

        {/* Back Link */}
        <div className="pt-2 text-center">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Customer Store
          </Link>
        </div>
      </div>
    </div>
  );
}
