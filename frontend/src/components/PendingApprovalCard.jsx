"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Phone,
  Mail,
  LogOut,
  ArrowLeft,
  Sparkles,
  Store,
  Bike,
} from "lucide-react";

export default function PendingApprovalCard({
  type = "SHOP_OWNER", // "SHOP_OWNER" | "DELIVERY_PARTNER"
  userName,
  entityName,
  onRefresh,
  onLogout,
}) {
  const [checking, setChecking] = useState(false);

  const isShop = type === "SHOP_OWNER";

  const handleRefresh = async () => {
    setChecking(true);
    if (onRefresh) {
      await onRefresh();
    } else {
      window.location.reload();
    }
    setTimeout(() => setChecking(false), 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full bg-slate-800/90 backdrop-blur-xl border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8 relative overflow-hidden">
        {/* Glow Accent */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header Icon + Pill */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-lg shadow-amber-500/10 relative">
            {isShop ? <Store className="w-10 h-10" /> : <Bike className="w-10 h-10" />}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
            </span>
          </div>

          <div>
            <span className="inline-block px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              ⏳ Application Under Review
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              {isShop ? "Shop Partner Onboarding" : "Delivery Fleet Onboarding"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mt-1">
              Welcome, <strong className="text-white">{userName || "Partner"}</strong>! Your application for{" "}
              <strong className="text-amber-300">{entityName || (isShop ? "your store" : "delivery account")}</strong> has been received.
            </p>
          </div>
        </div>

        {/* Expected Turnaround Banner */}
        <div className="bg-slate-900/80 border border-slate-700/70 rounded-2xl p-4 sm:p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
              Estimated Review Window
            </h4>
            <p className="text-base font-bold text-white">2 to 4 Business Hours</p>
            <p className="text-[11px] text-slate-400">
              Our operations team verifies merchant credentials and service areas promptly.
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 sm:p-5 space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Verification Progress
          </h4>

          <div className="space-y-3 text-xs">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-slate-200">Account & Details Registered</p>
                <p className="text-[11px] text-slate-500">Your credentials and basic details have been safely registered.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              </div>
              <div>
                <p className="font-bold text-amber-300">Admin Approval & Verification (In Progress)</p>
                <p className="text-[11px] text-slate-400">Our platform admin is reviewing your store documents and delivery coverage.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3 opacity-60">
              <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="font-bold text-slate-400">Portal Activation & Live Customer Orders</p>
                <p className="text-[11px] text-slate-500">You will gain complete access to manage catalogue, inventory, and orders.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Help */}
        <div className="bg-purple-950/30 border border-purple-800/30 rounded-2xl p-4 text-xs space-y-2">
          <p className="font-bold text-purple-300">Need urgent approval or have questions?</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-slate-300">
            <span className="flex items-center gap-1.5 font-medium">
              <Phone className="w-3.5 h-3.5 text-purple-400" /> +91 9985960692
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-purple-400" /> support@digitalcrowdtech.in
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking Status..." : "Check Approval Status"}
          </button>

          <div className="flex items-center justify-between pt-1">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Customer Store
            </Link>

            {onLogout && (
              <button
                onClick={onLogout}
                className="text-xs text-rose-400 hover:text-rose-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer font-bold"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
