"use client";

import React, { useState, useEffect } from "react";
import { Tag, Plus, Trash2 } from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";

export default function AdminCouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE",
    discountValue: "20",
    minOrderAmount: "299",
    maxDiscountAmount: "100",
    description: "",
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      let res;
      try {
        res = await apiClient.get("/admin/coupons");
      } catch (e) {
        res = await apiClient.get("/coupons");
      }

      if (res?.data?.success) {
        const raw = res.data.data;
        const list = Array.isArray(raw)
          ? raw
          : raw?.coupons || res.data.coupons || [];
        setCoupons(Array.isArray(list) ? list : []);
      } else {
        setCoupons([]);
      }
    } catch (err) {
      console.error("Failed to load coupons", err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase().trim(),
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: parseFloat(formData.minOrderAmount) || 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
      };

      let res;
      try {
        res = await apiClient.post("/admin/coupons", payload);
      } catch (err) {
        res = await apiClient.post("/coupons", payload);
      }

      if (res?.data?.success) {
        showToast("Global coupon created!", "success");
        setShowAddModal(false);
        setFormData({
          code: "",
          discountType: "PERCENTAGE",
          discountValue: "20",
          minOrderAmount: "299",
          maxDiscountAmount: "100",
          description: "",
        });
        loadCoupons();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create coupon", "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      try {
        await apiClient.delete(`/admin/coupons/${id}`);
      } catch (err) {
        await apiClient.delete(`/coupons/${id}`);
      }
      showToast("Coupon deleted", "info");
      loadCoupons();
    } catch (err) {
      showToast("Failed to delete", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Global Offers & Coupons</h1>
          <p className="text-xs text-slate-400">Platform-wide discount promo codes for quick-commerce users</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Coupon
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 text-xs text-slate-300">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white">Create Global Coupon</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500">✕</button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MONSOON30"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 font-mono uppercase text-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-hidden"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Rupee (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Max Discount (₹)</label>
                  <input
                    type="number"
                    value={formData.maxDiscountAmount}
                    onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Offer banner text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : !Array.isArray(coupons) || coupons.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-2">
          <Tag className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-bold text-white">No Coupons Configured</h3>
          <p className="text-xs text-slate-500">Create promotional discount codes for your customers.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Array.isArray(coupons) ? coupons : []).map((coupon) => {
            const discountType = coupon.discount_type || coupon.discountType || "PERCENTAGE";
            const discountValue = coupon.discount_value !== undefined ? coupon.discount_value : coupon.discountValue;
            const minOrder = coupon.min_order_amount !== undefined ? coupon.min_order_amount : coupon.minOrderAmount || 0;
            const maxDiscount = coupon.max_discount_amount !== undefined ? coupon.max_discount_amount : coupon.maxDiscountAmount;

            return (
              <div
                key={coupon.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-indigo-400 bg-indigo-950/60 border border-indigo-800 px-3 py-1 rounded-xl text-xs">
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => handleDelete(coupon.id)}
                      className="p-1 text-slate-500 hover:text-red-400 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <h3 className="text-sm font-bold text-white pt-2">
                    {discountType === "PERCENTAGE"
                      ? `${discountValue}% OFF`
                      : `₹${discountValue} FLAT OFF`}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {coupon.description || `Min order ₹${minOrder}`}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-500">
                  Min: ₹{minOrder} • Max Discount: ₹{maxDiscount || "None"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
