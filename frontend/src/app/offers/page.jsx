"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Tag, Copy, Check, Sparkles, Percent, ArrowRight } from "lucide-react";
import apiClient from "../../api/apiClient";
import { useToast } from "../../context/ToastContext";
import { useCart } from "../../context/CartContext";

export default function OffersPage() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  const { showToast } = useToast();
  const { applyCoupon } = useCart();

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/coupons");
      const list =
        res.data?.data?.coupons ||
        res.data?.coupons ||
        (Array.isArray(res.data?.data) ? res.data.data : []);
      setCoupons(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Coupon code ${code} copied!`, "success");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleApply = async (code) => {
    const res = await applyCoupon(code);
    if (res?.success) {
      showToast(`Coupon ${code} applied to your cart!`, "success");
    } else {
      showToast(res?.message || "Could not apply coupon", "error");
    }
  };

  const couponList = Array.isArray(coupons) ? coupons : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Percent className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Offers & Promo Codes
          </h1>
          <p className="text-xs text-slate-500">
            Apply these vouchers during checkout to save big on your groceries
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-3xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : couponList.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Tag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No active coupons at this moment</h3>
          <p className="text-xs text-slate-400">
            Check back soon for new promotions and seasonal grocery discount vouchers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {couponList.map((coupon) => {
            const isPercentage = (coupon.discount_type || coupon.discountType) === "PERCENTAGE";
            const discountVal = coupon.discount_value || coupon.discountValue || 0;
            const minOrder = coupon.min_order_amount || coupon.minOrderAmount || 0;
            const maxDiscount = coupon.max_discount_amount || coupon.maxDiscountAmount;
            const expiry = coupon.expiry_date || coupon.validUntil;

            return (
              <motion.div
                key={coupon.id}
                whileHover={{ y: -4 }}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-4 relative overflow-hidden"
              >
                {/* Top Accent Strip */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500" />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-xl text-sm tracking-wider">
                      {coupon.code}
                    </span>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg">
                      {isPercentage
                        ? `${discountVal}% OFF`
                        : `₹${discountVal} FLAT OFF`}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 pt-2">
                    {coupon.description || `Save on your daily essentials with ${coupon.code}`}
                  </h3>

                  <ul className="text-xs text-slate-500 space-y-1 pt-1">
                    {minOrder > 0 && <li>• Minimum order: ₹{minOrder}</li>}
                    {maxDiscount && <li>• Maximum discount: ₹{maxDiscount}</li>}
                    {expiry && <li>• Valid until: {new Date(expiry).toLocaleDateString()}</li>}
                  </ul>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedCode === coupon.code ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Code
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleApply(coupon.code)}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    Apply in Cart
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
