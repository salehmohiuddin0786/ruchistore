"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bike,
  ArrowLeft,
  Sparkles,
  Lock,
  Mail,
  User,
  Phone,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../../context/AuthContext";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";
import PendingApprovalCard from "../../../components/PendingApprovalCard";

export default function DeliveryPartnerLoginPage() {
  const router = useRouter();
  const { login, logout, user, isAuthenticated, isDeliveryPartner } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState("login"); // "login" | "register"

  // Login fields
  const [email, setEmail] = useState("delivery@store");
  const [password, setPassword] = useState("Admin@123");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register fields
  const [regData, setRegData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    vehicleType: "BIKE",
    vehicleNumber: "",
    licenseNumber: "",
  });
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [pendingDetails, setPendingDetails] = useState(null);

  // If already authenticated and pending approval
  if (isAuthenticated && isDeliveryPartner) {
    if (user?.deliveryStatus === "PENDING") {
      return (
        <PendingApprovalCard
          type="DELIVERY_PARTNER"
          userName={user.name}
          entityName="Delivery Partner Account"
          onRefresh={() => window.location.reload()}
          onLogout={logout}
        />
      );
    }
  }

  if (isPending) {
    return (
      <PendingApprovalCard
        type="DELIVERY_PARTNER"
        userName={pendingDetails?.name}
        entityName="Delivery Fleet Account"
        onRefresh={() => router.push("/delivery/dashboard")}
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

      if (res.user?.role !== "DELIVERY_PARTNER" && res.user?.role !== "ADMIN") {
        setLoginError("This account does not have Delivery Partner permissions.");
        return;
      }

      if (res.user?.deliveryStatus === "PENDING") {
        setIsPending(true);
        setPendingDetails({
          name: res.user.name,
        });
        return;
      }

      showToast("Signed in to Delivery Partner App", "success");
      router.push("/delivery/dashboard");
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

    if (!regData.name || !regData.phone || !regData.password) {
      setRegError("Please fill all required fields");
      setRegLoading(false);
      return;
    }

    try {
      const res = await apiClient.post("/auth/register-delivery", regData);
      if (res.data?.success) {
        showToast("Registration submitted for review!", "success");
        setIsPending(true);
        setPendingDetails({
          name: regData.name,
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-600/30">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Delivery Partner Fleet</h1>
            <p className="text-xs text-slate-400">Ruchi Express 15-Min Delivery App</p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex p-1 bg-slate-800 rounded-2xl border border-slate-700/80">
          <button
            type="button"
            onClick={() => setActiveTab("login")}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "login"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
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
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Join Delivery Fleet
          </button>
        </div>

        {/* SIGN IN TAB */}
        {activeTab === "login" ? (
          <>
            {/* Quick Demo Credentials */}
            <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-2xl p-4 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Demo Rider Credentials
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEmail("delivery@store");
                    setPassword("Admin@123");
                  }}
                  className="px-2 py-0.5 rounded-lg bg-emerald-800 text-emerald-200 text-[10px] font-bold hover:bg-emerald-700 cursor-pointer"
                >
                  Autofill
                </button>
              </div>
              <p className="text-slate-300 font-mono">
                Email: <strong className="text-white">delivery@store</strong>
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
                  Rider Username / Email
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="delivery@store"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm outline-hidden focus:border-emerald-400"
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
                  className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm outline-hidden focus:border-emerald-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {loginLoading ? "Authenticating..." : "Sign In to Delivery App"}
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
              <label className="block text-xs font-bold text-slate-300 mb-1">Rider Full Name *</label>
              <input
                type="text"
                value={regData.name}
                onChange={(e) => setRegData({ ...regData, name: e.target.value })}
                placeholder="Ramesh Kumar"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-emerald-400"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mobile (10 digits) *</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={regData.phone}
                  onChange={(e) => setRegData({ ...regData, phone: e.target.value.replace(/\D/g, "") })}
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-emerald-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={regData.email}
                  onChange={(e) => setRegData({ ...regData, email: e.target.value })}
                  placeholder="rider@store.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password *</label>
                <input
                  type="password"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                  placeholder="Create password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-emerald-400"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Vehicle Type</label>
                <select
                  value={regData.vehicleType}
                  onChange={(e) => setRegData({ ...regData, vehicleType: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-emerald-400"
                >
                  <option value="BIKE">Motorcycle / Bike</option>
                  <option value="SCOOTER">Scooter / Scooty</option>
                  <option value="ELECTRIC_VEHICLE">Electric Vehicle (EV)</option>
                  <option value="BICYCLE">Bicycle</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  value={regData.vehicleNumber}
                  onChange={(e) => setRegData({ ...regData, vehicleNumber: e.target.value })}
                  placeholder="TS-09-EA-1234"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-emerald-400"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Driving License No.</label>
                <input
                  type="text"
                  value={regData.licenseNumber}
                  onChange={(e) => setRegData({ ...regData, licenseNumber: e.target.value })}
                  placeholder="DL-0420110012345"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-hidden focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50 text-[11px] text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>After submission, your account will undergo rapid verification before activation.</span>
            </div>

            <button
              type="submit"
              disabled={regLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {regLoading ? "Submitting Application..." : "Submit Fleet Registration"}
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
