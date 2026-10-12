"use client";

import React, { useState, useEffect } from "react";
import {
  Store,
  MapPin,
  Phone,
  Clock,
  Image as ImageIcon,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  Percent,
  Power,
  Mail,
  FileText,
  Truck,
  Sparkles,
} from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";

export default function ShopOwnerProfilePage() {
  const { showToast } = useToast();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500081",
    logo: "",
    bannerImage: "",
    description: "",
    minOrderAmount: "0",
    openingTime: "06:00 AM",
    closingTime: "11:00 PM",
    estimatedDeliveryTime: "15-20 min",
    isOpen: true,
    gstNumber: "",
    panNumber: "",
  });

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/shop-owner/shop");
      if (res.data?.success) {
        const s = res.data.data?.shop || res.data.data;
        setShop(s);
        setFormData({
          name: s.name || "",
          phone: s.phone || "",
          email: s.email || "",
          address: s.address || "",
          city: s.city || "Hyderabad",
          state: s.state || "Telangana",
          pincode: s.pincode || "500081",
          logo: s.logo || "",
          bannerImage: s.bannerImage || s.cover_image || s.coverImage || "",
          description: s.description || "",
          minOrderAmount: (s.minOrderAmount ?? s.minimum_order)?.toString() || "0",
          openingTime: s.openingTime || s.opening_time || "06:00 AM",
          closingTime: s.closingTime || s.closing_time || "11:00 PM",
          estimatedDeliveryTime: s.estimatedDeliveryTime || s.estimated_delivery_time || "15-20 min",
          isOpen: s.is_open ?? s.isOpen ?? true,
          gstNumber: s.gstNumber || s.gst_number || "",
          panNumber: s.panNumber || s.pan_number || "",
        });
      }
    } catch (err) {
      console.error("Failed to load shop:", err);
      showToast("Failed to load store profile details", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStoreStatus = async () => {
    try {
      setTogglingStatus(true);
      const nextStatus = !formData.isOpen;
      const res = await apiClient.put("/shop-owner/shop/status", { isOpen: nextStatus });
      if (res.data?.success) {
        setFormData((prev) => ({ ...prev, isOpen: nextStatus }));
        setShop((prev) => (prev ? { ...prev, is_open: nextStatus } : prev));
        showToast(
          nextStatus ? "Store is now LIVE and accepting orders" : "Store is now marked CLOSED for orders",
          "success"
        );
      }
    } catch (err) {
      showToast("Failed to toggle store status", "error");
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await apiClient.put("/shop-owner/shop", formData);
      if (res.data?.success) {
        const updated = res.data.data?.shop || res.data.data;
        setShop(updated);
        showToast("Store details updated successfully!", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update store details", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header with Title and Live Status Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Store Profile & Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-700 border border-purple-200">
              {shop?.status || "VERIFIED"}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure your customer-facing storefront, operating timings, and contact info
          </p>
        </div>

        {/* Live Store Status Switcher */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <div className="text-right">
            <p className="text-xs font-black text-slate-900">
              {formData.isOpen ? "Store is Open" : "Store is Closed"}
            </p>
            <p className="text-[10px] text-slate-400">
              {formData.isOpen ? "Accepting orders" : "Customer orders paused"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleStoreStatus}
            disabled={togglingStatus}
            className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-xs ${
              formData.isOpen
                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30"
                : "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {formData.isOpen ? "Online" : "Offline"}
          </button>
        </div>
      </div>

      {/* Customer Storefront Preview Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="relative h-44 sm:h-52 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 overflow-hidden">
          {formData.bannerImage ? (
            <img
              src={formData.bannerImage}
              alt="Store Banner"
              className="w-full h-full object-cover object-center opacity-85"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-purple-300/40">
              <Store className="w-20 h-20" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />

          {/* Status pill on banner */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md backdrop-blur-xs ${
                formData.isOpen
                  ? "bg-emerald-500/90 text-white"
                  : "bg-rose-500/90 text-white"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {formData.isOpen ? "OPEN NOW" : "CURRENTLY CLOSED"}
            </span>
          </div>

          {/* Store details on banner bottom */}
          <div className="absolute bottom-4 left-6 right-6 flex items-end gap-4 text-white">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1 shadow-xl flex-shrink-0 border-2 border-white/80 overflow-hidden">
              {formData.logo ? (
                <img
                  src={formData.logo}
                  alt="Store Logo"
                  className="w-full h-full object-cover rounded-xl"
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div className="w-full h-full bg-purple-600 text-white flex items-center justify-center font-black text-2xl rounded-xl">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : "R"}
                </div>
              )}
            </div>

            <div className="flex-1 pb-1">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-md">
                {formData.name || "Your Storefront Name"}
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-200 mt-1">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-purple-300" />
                  {formData.city || "Hyderabad"}, {formData.pincode || "500081"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-purple-300" />
                  {formData.openingTime} - {formData.closingTime}
                </span>
                <span>•</span>
                <span className="text-purple-300 font-bold">
                  Commission: {shop?.commission_percentage || 10}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Store Identity */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Storefront Identity</h3>
              <p className="text-[11px] text-slate-400">Public name, description, and order rules</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                Store / Supermarket Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rafi nana Kirana"
                style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-sm placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                Store Description / Tagline
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Fresh groceries, daily essentials, and quick home delivery to your doorstep."
                style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-semibold text-xs placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.minOrderAmount}
                  onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                  placeholder="0.00"
                  style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Orders below this value will not be accepted. Set 0 for no limit.
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Estimated Delivery Time Window
                </label>
                <input
                  type="text"
                  value={formData.estimatedDeliveryTime}
                  onChange={(e) => setFormData({ ...formData, estimatedDeliveryTime: e.target.value })}
                  placeholder="e.g. 15-20 min"
                  style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
                />
                <span className="text-[10px] text-slate-400 block mt-1">
                  Shown to customers in the store list and checkout.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Operating Hours */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Contact & Store Timings</h3>
              <p className="text-[11px] text-slate-400">Merchant helpline and customer order hours</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                Contact Phone Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9490140848"
                style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                Store Email (Optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. owner@store.com"
                style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                Store Opening Time
              </label>
              <input
                type="text"
                value={formData.openingTime}
                onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                placeholder="06:00 AM"
                style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                Store Closing Time
              </label>
              <input
                type="text"
                value={formData.closingTime}
                onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                placeholder="11:00 PM"
                style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Physical Address & Location */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Physical Store Location</h3>
              <p className="text-[11px] text-slate-400">Used by riders for pickup and customers for local searches</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                Physical Store Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Shop #4, Main Road, Market Area, Adilabad"
                style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Hyderabad"
                  style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Telangana"
                  style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1.5">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  placeholder="500081"
                  style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Store Media & Branding */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Store Media & Branding Photos</h3>
              <p className="text-[11px] text-slate-400">High-resolution banner and square logo image URLs</p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                Store Banner Image URL
              </label>
              <input
                type="url"
                value={formData.bannerImage}
                onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Recommended aspect ratio: 16:9 or 3:1 (horizontal landscape)
              </span>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                Store Square Logo URL
              </label>
              <input
                type="url"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                placeholder="https://images.unsplash.com/photo-..."
                style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder:text-slate-400 outline-hidden focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
              />
              <span className="text-[10px] text-slate-400 block mt-1">
                Recommended aspect ratio: 1:1 (square avatar)
              </span>
            </div>
          </div>
        </div>

        {/* Section 5: Compliance & GST */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Tax & Merchant Registration</h3>
              <p className="text-[11px] text-slate-400">Optional government business identification numbers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                GSTIN Number (Optional)
              </label>
              <input
                type="text"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. 36AAAAA0000A1Z5"
                style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder:text-slate-400 outline-hidden uppercase focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
              />
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1.5">
                PAN Number (Optional)
              </label>
              <input
                type="text"
                value={formData.panNumber}
                onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                placeholder="e.g. ABCDE1234F"
                style={{ color: "#0f172a", backgroundColor: "#ffffff" }}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder:text-slate-400 outline-hidden uppercase focus:border-purple-600 focus:ring-2 focus:ring-purple-100 transition-all shadow-xs"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Store Details..." : "Save Store Details"}
          </button>

          <button
            type="button"
            onClick={loadShop}
            disabled={saving}
            className="px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
          >
            Reset Changes
          </button>
        </div>
      </form>
    </div>
  );
}
