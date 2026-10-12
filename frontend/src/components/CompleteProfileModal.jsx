"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ShieldCheck, X, Check, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import apiClient from "../api/apiClient";

export default function CompleteProfileModal() {
  const { user, isAuthenticated, updateUser } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsOpen(false);
      return;
    }

    const hasValidPhone = user.phone && !user.phone.startsWith("g_") && user.phone.length >= 10;
    const skipped = typeof window !== "undefined" ? sessionStorage.getItem("ruchi_skipped_phone_prompt") === "true" : false;

    if (!hasValidPhone && !skipped) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [user, isAuthenticated]);

  const handleSkip = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ruchi_skipped_phone_prompt", "true");
    }
    setIsOpen(false);
  };

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 10) {
      setPhone(raw);
      setErrorMsg("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg("");
      const res = await apiClient.put("/user/profile", { phone });
      if (res.data?.success) {
        showToast("Mobile number updated successfully!", "success");
        if (updateUser) {
          updateUser({ phone });
        }
        if (typeof window !== "undefined") {
          sessionStorage.setItem("ruchi_skipped_phone_prompt", "true");
        }
        setIsOpen(false);
      } else {
        setErrorMsg(res.data?.message || "Failed to update phone number");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Error updating phone number");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleSkip}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-slate-100"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white relative">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
              <Phone className="w-6 h-6 text-white" />
            </div>

            <h3 className="text-xl font-black tracking-tight">Complete Your Profile</h3>
            <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
              Add your mobile number for live order tracking, doorstep handover OTP, and delivery coordination.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Mobile Number (10 Digits)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-bold text-slate-500 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  autoFocus
                  placeholder="98765 43210"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 outline-hidden focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                We will only use this number for delivery SMS and rider calls.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Skip for now
              </button>
              <button
                type="submit"
                disabled={submitting || phone.length !== 10}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                {submitting ? (
                  "Saving..."
                ) : (
                  <>
                    Save & Continue <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
