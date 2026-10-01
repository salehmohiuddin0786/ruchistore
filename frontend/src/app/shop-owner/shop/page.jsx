"use client";

import React, { useState, useEffect } from "react";
import { Store, MapPin, Phone, Clock, Image, Save } from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";

export default function ShopOwnerProfilePage() {
  const { showToast } = useToast();
  const [shop, setShop] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    city: "Hyderabad",
    pincode: "500081",
    logo: "",
    bannerImage: "",
    description: "",
    minOrderAmount: "0",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadShop();
  }, []);

  const loadShop = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/shop-owner/shop");
      if (res.data?.success) {
        const s = res.data.data;
        setShop(s);
        setFormData({
          name: s.name || "",
          phone: s.phone || "",
          address: s.address || "",
          city: s.city || "Hyderabad",
          pincode: s.pincode || "500081",
          logo: s.logo || "",
          bannerImage: s.bannerImage || "",
          description: s.description || "",
          minOrderAmount: s.minOrderAmount?.toString() || "0",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await apiClient.put("/shop-owner/shop", formData);
      if (res.data?.success) {
        showToast("Store details updated successfully", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update store", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Store Profile & Settings</h1>
        <p className="text-xs text-slate-500">Configure your storefront appearance, address, and contact details</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 text-xs">
        <div>
          <label className="font-bold text-slate-700 block mb-1">Store / Supermarket Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden focus:bg-white focus:border-purple-500 font-semibold"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Contact Phone *</label>
            <input
              type="text"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden focus:bg-white focus:border-purple-500"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Minimum Order Amount (₹)</label>
            <input
              type="number"
              value={formData.minOrderAmount}
              onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden focus:bg-white focus:border-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Physical Store Address *</label>
          <input
            type="text"
            required
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden focus:bg-white focus:border-purple-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-slate-700 block mb-1">City</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Pincode</label>
            <input
              type="text"
              value={formData.pincode}
              onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden"
            />
          </div>
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Store Banner Image URL</label>
          <input
            type="url"
            value={formData.bannerImage}
            onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
            placeholder="https://images.unsplash.com/..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden"
          />
        </div>

        <div>
          <label className="font-bold text-slate-700 block mb-1">Store Description / About</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Store Details"}
          </button>
        </div>
      </form>
    </div>
  );
}
