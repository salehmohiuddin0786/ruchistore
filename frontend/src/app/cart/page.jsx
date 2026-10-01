"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  ArrowRight,
  Plus,
  Minus,
  Trash2,
  Tag,
  ShieldCheck,
  Store,
  Clock,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

export default function CartPage() {
  const router = useRouter();
  const {
    items = [],
    shop,
    cartTotal,
    cartSubtotal,
    itemDiscountTotal,
    couponDiscount,
    deliveryFee,
    taxAmount,
    couponCode,
    appliedCoupon,
    updateQuantity,
    removeFromCart,
    clearCart,
    applyCoupon,
    removeCoupon,
    loading,
    fetchCart,
  } = useCart();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [inputCoupon, setInputCoupon] = useState("");
  const [couponError, setCouponError] = useState("");

  React.useEffect(() => {
    if (fetchCart) {
      fetchCart();
    }
  }, [fetchCart]);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (!inputCoupon.trim()) return;
    const res = applyCoupon(inputCoupon.trim());
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponError("");
      setInputCoupon("");
    }
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Loading your cart items...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Your Cart is Empty</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Looks like you haven't added any groceries to your cart yet. Explore fresh vegetables, dairy and essentials!
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          Start Shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
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
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              My Shopping Cart ({items.length} {items.length === 1 ? "item" : "items"})
            </h1>
            {shop && (
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Store className="w-3.5 h-3.5 text-indigo-600" />
                Ordering from: <span className="font-bold text-slate-700">{shop.name}</span>
              </p>
            )}
          </div>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-red-600 hover:text-red-700 font-semibold px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
        >
          Empty Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List (Left Column) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            {items.map((item, idx) => {
              const prod = item.product || item;
              const effectivePrice =
                prod.discount_price != null
                  ? Number(prod.discount_price)
                  : prod.discountPrice != null
                  ? Number(prod.discountPrice)
                  : Number(prod.price || 0);
              const lineTotal = effectivePrice * item.quantity;
              const itemKey = item.id || item.product_id || item.productId || prod.id || `cart-item-${idx}`;

              return (
                <div
                  key={itemKey}
                  className="flex items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-b-0"
                >
                  {/* Image & Title */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 p-2 border border-slate-100 shrink-0">
                      <img
                        src={prod.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200"}
                        alt={prod.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {prod.name}
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">
                        {prod.unit ? `${prod.unit_value || prod.unitValue || 1} ${prod.unit}` : "1 pack"} • ₹{effectivePrice} each
                      </p>
                      {prod.discount_price && Number(prod.discount_price) < Number(prod.price) && (
                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                          Save ₹{Number(prod.price) - Number(prod.discount_price)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity Stepper & Price */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg bg-white text-slate-700 flex items-center justify-center hover:bg-slate-200 shadow-xs text-xs font-bold"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-xs font-black text-slate-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 shadow-xs text-xs font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-right w-16">
                      <span className="text-sm font-black text-slate-900 block">
                        ₹{lineTotal}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delivery Promise Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-950">Guaranteed 10-Minute Doorstep Delivery</h4>
              <p className="text-[11px] text-emerald-800">
                Your order is packed securely from {shop?.name || "your local partner supermarket"}.
              </p>
            </div>
          </div>
        </div>

        {/* Bill Summary (Right Column) */}
        <div className="space-y-4">
          {/* Coupon Box */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-indigo-600" /> Apply Promo Code
            </h3>

            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div>
                  <span className="font-mono text-xs font-bold text-emerald-900 block">
                    {appliedCoupon.code} APPLIED
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    Saved ₹{couponDiscount} with this offer
                  </span>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter coupon code (e.g. SAVE50)"
                    value={inputCoupon}
                    onChange={(e) => setInputCoupon(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-xs font-mono uppercase tracking-wider border border-slate-200 outline-hidden focus:bg-white focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-[11px] text-red-500 font-medium">{couponError}</p>
                )}
              </form>
            )}
          </div>

          {/* Bill Details */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Bill Summary
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span>₹{cartSubtotal}</span>
              </div>

              {itemDiscountTotal > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Product Savings</span>
                  <span>- ₹{itemDiscountTotal}</span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>- ₹{couponDiscount}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  Delivery Fee
                  {deliveryFee === 0 && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 font-bold px-1.5 py-0.5 rounded-sm">
                      FREE
                    </span>
                  )}
                </span>
                <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
              </div>

              <div className="flex justify-between text-slate-600">
                <span>Govt. GST & Taxes (5%)</span>
                <span>₹{taxAmount}</span>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <div>
                  <span className="text-base font-black text-slate-900 block">Grand Total</span>
                  <span className="text-[11px] text-slate-400">Inclusive of all taxes</span>
                </div>
                <span className="text-2xl font-black text-slate-900">
                  ₹{cartTotal}
                </span>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              onClick={() => router.push("/checkout")}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
