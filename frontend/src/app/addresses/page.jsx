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
  Crosshair,
  Phone,
  User,
} from "lucide-react";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { getCurrentGeoAddress } from "../../lib/geo";

export default function AddressesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    type: "HOME",
    flat: "",
    addressLine1: "",
    landmark: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500081",
    deliveryInstructions: "",
    isDefault: false,
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
      if (user) {
        setFormData((prev) => ({
          ...prev,
          name: prev.name || user.name || "",
          phone: prev.phone || (user.phone && !user.phone.startsWith("g_") ? user.phone : ""),
        }));
      }
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

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

  const handleUseCurrentLocation = async () => {
    try {
      setDetectingGps(true);
      showToast("Fetching your current GPS location...", "info");
      const geo = await getCurrentGeoAddress();
      setFormData((prev) => ({
        ...prev,
        addressLine1: geo.addressLine || prev.addressLine1,
        city: geo.city || prev.city,
        state: geo.state || prev.state,
        pincode: geo.pincode || prev.pincode,
        latitude: geo.latitude,
        longitude: geo.longitude,
      }));
      showToast(`Location autofilled: ${geo.addressLine || geo.city}`, "success");
    } catch (err) {
      showToast(err.message || "Failed to detect location", "warning");
    } finally {
      setDetectingGps(false);
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      showToast("Please enter contact person name", "error");
      return;
    }
    const cleanPhone = String(formData.phone || "").replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      showToast("Please enter a valid 10-digit mobile number", "error");
      return;
    }
    if (!formData.addressLine1 || !formData.pincode) {
      showToast("Please enter street address and pincode", "error");
      return;
    }

    try {
      const res = await apiClient.post("/addresses", {
        ...formData,
        phone: cleanPhone.slice(-10),
      });
      if (res.data?.success) {
        showToast("Address saved successfully!", "success");
        setShowAddModal(false);
        setFormData({
          name: user?.name || "",
          phone: user?.phone && !user.phone.startsWith("g_") ? user.phone : "",
          type: "HOME",
          flat: "",
          addressLine1: "",
          landmark: "",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500081",
          deliveryInstructions: "",
          isDefault: false,
          latitude: null,
          longitude: null,
        });
        await loadAddresses();
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
          onClick={() => {
            setShowAddModal(true);
            setFormData((prev) => ({
              ...prev,
              name: prev.name || user?.name || "",
              phone: prev.phone || (user?.phone && !user.phone.startsWith("g_") ? user.phone : ""),
            }));
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      {/* Add Address Form Modal / Inline */}
      {showAddModal && (
        <form
          onSubmit={handleCreateAddress}
          className="bg-white rounded-3xl p-6 border border-emerald-500/30 shadow-lg space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Add New Delivery Address</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={detectingGps}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-colors cursor-pointer"
              >
                <Crosshair className={`w-3.5 h-3.5 ${detectingGps ? "animate-spin" : ""}`} />
                {detectingGps ? "Detecting GPS..." : "Use Current Location"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600 p-1"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {["HOME", "WORK", "OTHER"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFormData({ ...formData, type: t })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  formData.type === t
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Recipient / Contact Name *
              </label>
              <input
                type="text"
                placeholder="Full Name (e.g. Rahul Sharma)"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden focus:bg-white focus:border-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Mobile Number for Delivery *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400 font-semibold select-none">+91</span>
                <input
                  type="tel"
                  placeholder="98765 43210"
                  required
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                  }
                  className="w-full pl-11 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden focus:bg-white focus:border-emerald-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Location Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Flat / House / Floor No.
              </label>
              <input
                type="text"
                placeholder="Flat 402, Cyber Heights"
                value={formData.flat}
                onChange={(e) => setFormData({ ...formData, flat: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden focus:bg-white focus:border-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Street Address / Colony *
              </label>
              <input
                type="text"
                placeholder="Road No. 36, Madhapur *"
                required
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden focus:bg-white focus:border-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                placeholder="Near Metro Station"
                value={formData.landmark}
                onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden focus:bg-white focus:border-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Pincode *
              </label>
              <input
                type="text"
                placeholder="500081 *"
                required
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden focus:bg-white focus:border-emerald-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Delivery Instructions (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Leave with guard, ring doorbell twice"
              value={formData.deliveryInstructions}
              onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs outline-hidden focus:bg-white focus:border-emerald-500 font-medium"
            />
          </div>

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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs cursor-pointer"
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
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
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
                  {(addr.name || addr.phone) && (
                    <div className="flex items-center gap-3 text-slate-700 font-semibold text-xs">
                      {addr.name && <span>{addr.name}</span>}
                      {addr.phone && (
                        <span className="text-emerald-700 flex items-center gap-1 font-bold">
                          <Phone className="w-3 h-3" /> +91 {addr.phone}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-slate-700">
                    {addr.flat ? `${addr.flat}, ` : addr.house_flat ? `${addr.house_flat}, ` : ""}
                    {addr.addressLine1 || addr.address_line}
                    {addr.landmark ? ` (Near ${addr.landmark})` : ""}
                  </p>
                  <p className="text-slate-400">
                    {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  {addr.deliveryInstructions && (
                    <p className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg inline-block font-medium">
                      Note: {addr.deliveryInstructions}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-semibold cursor-pointer"
                  >
                    Set Default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete address"
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
