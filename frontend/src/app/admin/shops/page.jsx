"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Store, CheckCircle, XCircle, Star, Phone, MapPin, Plus, X } from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";

export default function AdminShopsPage() {
  const { showToast } = useToast();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add shop modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addForm, setAddForm] = useState({
    shopName: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    ownerPassword: "Admin@123",
    shopAddress: "",
    city: "Hyderabad",
    pincode: "500081",
    commissionPercentage: 10,
    status: "APPROVED",
  });

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/shops");
      if (res.data?.success) {
        setShops(res.data.data?.shops || res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShop = async (e) => {
    e.preventDefault();
    if (!addForm.shopName || !addForm.ownerPhone) {
      showToast("Shop name and owner phone are required", "error");
      return;
    }

    try {
      setAddLoading(true);
      const res = await apiClient.post("/admin/shops", addForm);
      if (res.data?.success) {
        showToast("Shop & Owner created successfully!", "success");
        setIsAddOpen(false);
        setAddForm({
          shopName: "",
          ownerName: "",
          ownerPhone: "",
          ownerEmail: "",
          ownerPassword: "Admin@123",
          shopAddress: "",
          city: "Hyderabad",
          pincode: "500081",
          commissionPercentage: 10,
          status: "APPROVED",
        });
        loadShops();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create shop", "error");
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleApproval = async (shopId, currentStatus) => {
    try {
      const nextApproved = !currentStatus;
      const res = await apiClient.put(`/admin/shops/${shopId}/status`, {
        status: nextApproved ? "APPROVED" : "PENDING",
        isApproved: nextApproved,
      });
      if (res.data?.success) {
        showToast(nextApproved ? "Shop approved successfully!" : "Shop suspended successfully!", "success");
        loadShops();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update shop status", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Partner Grocery Shops</h1>
          <p className="text-xs text-slate-400">Review, approve, and manage supermarket partner merchants</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Shop & Owner
        </button>
      </div>

      {/* Add Shop Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black text-white">Add New Partner Shop</h3>
              </div>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShop} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Store / Shop Name *</label>
                <input
                  type="text"
                  value={addForm.shopName}
                  onChange={(e) => setAddForm({ ...addForm, shopName: e.target.value })}
                  placeholder="e.g. Daily Fresh Supermarket"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-indigo-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Owner Full Name</label>
                  <input
                    type="text"
                    value={addForm.ownerName}
                    onChange={(e) => setAddForm({ ...addForm, ownerName: e.target.value })}
                    placeholder="Merchant Name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Owner Mobile *</label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={addForm.ownerPhone}
                    onChange={(e) => setAddForm({ ...addForm, ownerPhone: e.target.value.replace(/\D/g, "") })}
                    placeholder="10-digit number"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-indigo-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Owner Email</label>
                  <input
                    type="email"
                    value={addForm.ownerEmail}
                    onChange={(e) => setAddForm({ ...addForm, ownerEmail: e.target.value })}
                    placeholder="owner@store.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Login Password</label>
                  <input
                    type="password"
                    value={addForm.ownerPassword}
                    onChange={(e) => setAddForm({ ...addForm, ownerPassword: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Store Address</label>
                <input
                  type="text"
                  value={addForm.shopAddress}
                  onChange={(e) => setAddForm({ ...addForm, shopAddress: e.target.value })}
                  placeholder="Plot / Shop No, Street, Landmark"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-indigo-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">City</label>
                  <input
                    type="text"
                    value={addForm.city}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={addForm.pincode}
                    onChange={(e) => setAddForm({ ...addForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Commission %</label>
                  <input
                    type="number"
                    value={addForm.commissionPercentage}
                    onChange={(e) => setAddForm({ ...addForm, commissionPercentage: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white outline-hidden focus:border-indigo-400"
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50"
                >
                  {addLoading ? "Creating..." : "Create & Approve Shop"}
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
      ) : shops.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <Store className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold">No shops registered yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => {
            const isApproved = shop.isApproved || shop.status === "APPROVED";

            return (
              <div
                key={shop.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-500">ID #{shop.id}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isApproved
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {isApproved ? "Approved" : "Pending Approval"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white">{shop.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" /> {shop.address}
                    </p>
                    {shop.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> {shop.phone}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {shop.rating || "4.8"}
                    </span>
                    <span>Commission: {shop.commissionRate || shop.commission_percentage || 10}%</span>
                    <span>Min Order: ₹{shop.minOrderAmount || shop.minimum_order || 0}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <Link
                    href={`/shop/${shop.id}`}
                    target="_blank"
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    View Storefront
                  </Link>

                  <button
                    onClick={() => handleToggleApproval(shop.id, isApproved)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isApproved
                        ? "bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    }`}
                  >
                    {isApproved ? "Suspend Shop" : "Approve Shop"}
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
