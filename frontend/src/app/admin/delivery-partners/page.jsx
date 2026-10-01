"use client";

import React, { useState, useEffect } from "react";
import { Bike, Star, Phone, CheckCircle, ShieldCheck } from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";

export default function AdminDeliveryPartnersPage() {
  const { showToast } = useToast();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/delivery-partners");
      if (res.data?.success) {
        setPartners(res.data.data?.partners || res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = async (partnerId, currentStatus) => {
    try {
      const nextApproved = !currentStatus;
      await apiClient.put(`/admin/delivery-partners/${partnerId}/status`, {
        status: nextApproved ? "APPROVED" : "PENDING",
        isApproved: nextApproved,
      });
      showToast(nextApproved ? "Delivery partner approved successfully!" : "Delivery partner suspended!", "success");
      loadPartners();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update partner status", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Delivery Fleet</h1>
        <p className="text-xs text-slate-400">Manage on-demand delivery partners and monitor live rider availability</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : partners.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <Bike className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold">No delivery partners registered yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {partners.map((partner) => {
            const isApproved = partner.isApproved || partner.is_approved || partner.status === "APPROVED";
            const isOnline = partner.isOnline || partner.is_online;
            const vehicle = partner.vehicleNumber || partner.vehicle_number || "Two Wheeler";
            const completedCount = partner.totalDeliveries !== undefined ? partner.totalDeliveries : (partner.total_deliveries || 0);

            return (
              <div
                key={partner.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-500">Rider #{partner.id}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isOnline
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {isOnline ? "● Online" : "Offline"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white">{partner.user?.name || "Rider"}</h3>
                    <p className="text-xs text-slate-400">{partner.user?.phone || "+91 98765 43210"}</p>
                    <p className="text-xs text-slate-400 mt-1 font-mono uppercase">
                      Vehicle: {vehicle}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {partner.rating || "4.9"}
                    </span>
                    <span>Completed: {completedCount} trips</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className={`text-xs font-bold ${isApproved ? "text-emerald-400" : "text-amber-400"}`}>
                    {isApproved ? "✓ Verified Rider" : "Pending Verification"}
                  </span>

                  <button
                    onClick={() => handleToggleApproval(partner.id, isApproved)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isApproved
                        ? "bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    }`}
                  >
                    {isApproved ? "Suspend" : "Approve"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
