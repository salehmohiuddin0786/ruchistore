"use client";

import React, { useState, useEffect } from "react";
import { Bike, Star, Phone, CheckCircle, ShieldCheck, Plus, X } from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";

export default function AdminDeliveryPartnersPage() {
  const { showToast } = useToast();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Rider modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "Admin@123",
    vehicleType: "BIKE",
    vehicleNumber: "",
    licenseNumber: "",
    status: "APPROVED",
  });

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

  const handleCreatePartner = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.phone) {
      showToast("Rider name and phone are required", "error");
      return;
    }

    try {
      setAddLoading(true);
      const res = await apiClient.post("/admin/delivery-partners", addForm);
      if (res.data?.success) {
        showToast("Delivery Partner created & approved successfully!", "success");
        setIsAddOpen(false);
        setAddForm({
          name: "",
          phone: "",
          email: "",
          password: "Admin@123",
          vehicleType: "BIKE",
          vehicleNumber: "",
          licenseNumber: "",
          status: "APPROVED",
        });
        loadPartners();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create partner", "error");
    } finally {
      setAddLoading(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Delivery Fleet</h1>
          <p className="text-xs text-slate-400">Manage on-demand delivery partners and monitor live rider availability</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Delivery Rider
        </button>
      </div>

      {/* Add Rider Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Bike className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white">Add Delivery Partner</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePartner} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Rider Full Name *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-emerald-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mobile (10 digits) *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value.replace(/\D/g, "") })}
                    placeholder="9876543210"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-emerald-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="rider@store.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Login Password</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Vehicle Type</label>
                  <select
                    value={addForm.vehicleType}
                    onChange={(e) => setAddForm({ ...addForm, vehicleType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-emerald-400"
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
                  <label className="block text-slate-300 font-bold mb-1">Vehicle Registration No.</label>
                  <input
                    type="text"
                    value={addForm.vehicleNumber}
                    onChange={(e) => setAddForm({ ...addForm, vehicleNumber: e.target.value })}
                    placeholder="TS-09-XX-0000"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Driving License No.</label>
                  <input
                    type="text"
                    value={addForm.licenseNumber}
                    onChange={(e) => setAddForm({ ...addForm, licenseNumber: e.target.value })}
                    placeholder="DL-0420110012345"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all disabled:opacity-50"
                >
                  {addLoading ? "Creating..." : "Create & Approve Rider"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
