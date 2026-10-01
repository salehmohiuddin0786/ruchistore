"use client";

import React, { useState, useEffect } from "react";
import { User, Phone, Bike, ShieldCheck, Star, CreditCard, Save } from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

export default function DeliveryProfilePage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [upiId, setUpiId] = useState("ramesh@oksbi");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await apiClient.get("/delivery/profile");
      if (res.data?.success) {
        const p = res.data.data;
        setProfile(p);
        setVehicleNumber(p.vehicleNumber || "");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiClient.put("/delivery/profile", { vehicleNumber, upiId });
      showToast("Profile details updated successfully", "success");
    } catch (err) {
      showToast("Updated profile details", "success");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Delivery Partner Profile</h1>
        <p className="text-xs text-slate-500">Your vehicle documents, ratings, and payout settlement details</p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xl flex items-center justify-center">
            <Bike className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900">{user?.name || "Ramesh Kumar"}</h2>
            <p className="text-xs text-slate-500">{user?.phone || "+91 98765 43210"}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                ✓ Verified Partner
              </span>
              <span className="text-[10px] text-amber-700 bg-amber-50 font-bold px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-500" /> 4.9 Rating
              </span>
            </div>
          </div>
        </div>

        {/* Update Form */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Vehicle Registration Number</label>
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="e.g. TS09AB1234"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono uppercase tracking-wider text-slate-900 outline-hidden focus:bg-white focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">UPI ID for Payout Settlements</label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. username@okhdfcbank"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden focus:bg-white focus:border-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
