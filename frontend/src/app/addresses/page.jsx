"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Home,
  Briefcase,
  Plus,
  Trash2,
  Check,
  ArrowLeft,
  Navigation,
} from "lucide-react";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function AddressesPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    type: "HOME",
    flat: "",
    addressLine1: "",
    landmark: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500081",
    deliveryInstructions: "",
    isDefault: false,
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/addresses");
      if (res.data?.success) {
        const raw = res.data.data;
        const addrs = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.addresses)
          ? raw.addresses
          : Array.isArray(res.data?.addresses)
          ? res.data.addresses
          : [];
        setAddresses(addrs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!formData.addressLine1 || !formData.pincode) {
      showToast("Please enter street address and pincode", "error");
      return;
    }

    try {
      const res = await apiClient.post("/addresses", formData);
      if (res.data?.success) {
        showToast("Address saved successfully!", "success");
        setShowAddModal(false);
        setFormData({
          type: "HOME",
          flat: "",
          addressLine1: "",
          landmark: "",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500081",
          deliveryInstructions: "",
          isDefault: false,
        });
        loadAddresses();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save address", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      await apiClient.delete(`/addresses/${id}`);
      showToast("Address removed", "info");
      loadAddresses();
    } catch (err) {
      showToast("Failed to remove address", "error");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await apiClient.put(`/addresses/${id}/default`);
      showToast("Default address updated", "success");
      loadAddresses();
    } catch (err) {
      showToast("Failed to set default address", "error");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Sign in to manage addresses</h2>
        <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Saved Addresses</h1>
            <p className="text-xs text-slate-500">Manage delivery locations for quick 10-min checkout</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {/* Add Address Form Modal / Inline */}
      {showAddModal && (
        <form
          onSubmit={handleCreateAddress}
          className="bg-white rounded-3xl p-6 border border-emerald-500/30 shadow-md space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Add New Delivery Address</h2>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <div className="flex gap-2">
            {["HOME", "WORK", "OTHER"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFormData({ ...formData, type: t })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  formData.type === t
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <input
              type="text"
              placeholder="Flat / House / Floor No."
              value={formData.flat}
              onChange={(e) => setFormData({ ...formData, flat: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden focus:bg-white focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Complete Street Address *"
              required
              value={formData.addressLine1}
              onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden focus:bg-white focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Landmark (Optional)"
              value={formData.landmark}
              onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden focus:bg-white focus:border-emerald-500"
            />
            <input
              type="text"
              placeholder="Pincode *"
              required
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden focus:bg-white focus:border-emerald-500"
            />
          </div>

          <input
            type="text"
            placeholder="Delivery Instructions (Optional, e.g. Ring bell, leave at guard)"
            value={formData.deliveryInstructions}
            onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-hidden focus:bg-white focus:border-emerald-500"
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isDefault"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="rounded-sm text-emerald-600"
            />
            <label htmlFor="isDefault" className="text-xs text-slate-700 cursor-pointer">
              Set as default delivery address
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs"
            >
              Save Address
            </button>
          </div>
        </form>
      )}

      {/* Address List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-3xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No saved addresses</h3>
          <p className="text-xs text-slate-400">
            Add your home or work address for easy 1-click checkout.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  {addr.type === "WORK" ? (
                    <Briefcase className="w-5 h-5" />
                  ) : (
                    <Home className="w-5 h-5" />
                  )}
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900">{addr.type}</span>
                    {addr.isDefault && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700">
                    {addr.flat ? `${addr.flat}, ` : ""}
                    {addr.addressLine1}
                  </p>
                  <p className="text-slate-400">
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  {addr.deliveryInstructions && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg inline-block">
                      Note: {addr.deliveryInstructions}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-semibold"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
