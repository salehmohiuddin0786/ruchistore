"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Tag,
  CheckCircle2,
  AlertCircle,
  Truck,
  Sparkles,
} from "lucide-react";
import { useCart } from "../context/CartContext";

export default function CartDrawer() {
  const router = useRouter();
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    currentShop,
    pricing,
    updateQuantity,
    removeItem,
    clearCart,
    applyCouponCode,
    removeCoupon,
    appliedCoupon,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponLoading(true);
    await applyCouponCode(couponInput.trim());
    setCouponLoading(false);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    router.push("/checkout");
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">My Cart</h2>
                    {currentShop && (
                      <p className="text-xs text-slate-500 truncate max-w-[220px]">
                        From: <span className="font-semibold text-slate-700">{currentShop.name}</span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Store Closed indicator */}
              {currentShop && currentShop.is_open === false && (
                <div className="bg-rose-50 px-5 py-2.5 border-b border-rose-200/70 flex items-center gap-2 text-xs font-semibold text-rose-800">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>This store is currently closed and not accepting orders.</span>
                </div>
              )}

              {/* Free delivery indicator */}
              {pricing && pricing.amountNeededForFreeDelivery > 0 && cartItems.length > 0 && (
                <div className="bg-amber-50 px-5 py-2.5 border-b border-amber-200/60 flex items-center gap-2 text-xs font-semibold text-amber-900">
                  <Truck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    Add <strong>₹{pricing.amountNeededForFreeDelivery}</strong> more to unlock{" "}
                    <strong className="text-emerald-700">FREE Delivery!</strong>
                  </span>
                </div>
              )}
              {pricing && pricing.deliveryFee === 0 && cartItems.length > 0 && (
                <div className="bg-emerald-50 px-5 py-2 border-b border-emerald-200/60 flex items-center gap-2 text-xs font-semibold text-emerald-800">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>🎉 Congratulations! You have unlocked FREE 15-minute delivery!</span>
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-16">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                      <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Your cart is empty</h3>
                    <p className="text-sm text-slate-500 max-w-xs mt-1 mb-6">
                      Add fresh groceries, fruits, snacks and daily essentials to get started.
                    </p>
                    <button
                      onClick={() => setIsCartOpen(false)}
                      className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md transition-colors"
                    >
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Items List */}
                    <div className="space-y-3">
                      {cartItems.map((item) => {
                        const product = item.product;
                        if (!product) return null;

                        const effectivePrice = product.discount_price || product.price;

                        return (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 transition-colors shadow-2xs"
                          >
                            <div className="w-14 h-14 rounded-xl bg-slate-50 shrink-0 overflow-hidden relative border border-slate-100">
                              {product.image ? (
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  sizes="56px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <ShoppingBag className="w-6 h-6" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-slate-800 truncate">
                                {product.name}
                              </h4>
                              <p className="text-xs text-slate-400 truncate">
                                {product.unit_value || product.unit}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-sm font-extrabold text-slate-900">
                                  ₹{effectivePrice}
                                </span>
                                {product.discount_price && (
                                  <span className="text-xs text-slate-400 line-through">
                                    ₹{product.price}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-slate-700 hover:bg-slate-200 shadow-xs text-xs font-bold transition-colors"
                              >
                                {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-500" /> : <Minus className="w-3.5 h-3.5" />}
                              </button>
                              <span className="text-xs font-bold w-4 text-center text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 shadow-xs text-xs font-bold transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Coupons Section */}
                    <div className="pt-2">
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                          <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                            <Tag className="w-4 h-4 text-emerald-600" />
                            <span>Coupon <strong>{appliedCoupon}</strong> applied!</span>
                          </div>
                          <button
                            onClick={removeCoupon}
                            className="text-red-500 hover:text-red-700 font-bold ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyCoupon} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Enter Promo Code (e.g. SAVE50)"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-indigo-500 uppercase tracking-wider font-semibold"
                          />
                          <button
                            type="submit"
                            disabled={couponLoading || !couponInput.trim()}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors disabled:opacity-50"
                          >
                            Apply
                          </button>
                        </form>
                      )}
                    </div>

                    {/* Bill Details */}
                    {pricing && (
                      <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                        <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                          Bill Details
                        </h4>

                        <div className="flex justify-between text-slate-600">
                          <span>Items MRP Total</span>
                          <span className="font-medium">₹{pricing.mrpTotal}</span>
                        </div>

                        {pricing.productDiscount > 0 && (
                          <div className="flex justify-between text-emerald-600 font-medium">
                            <span>Product Discounts</span>
                            <span>-₹{pricing.productDiscount}</span>
                          </div>
                        )}

                        {pricing.couponDiscount > 0 && (
                          <div className="flex justify-between text-emerald-600 font-semibold">
                            <span>Coupon Savings ({appliedCoupon})</span>
                            <span>-₹{pricing.couponDiscount}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-slate-600">
                          <span>Delivery Partner Fee</span>
                          <span>
                            {pricing.deliveryFee === 0 ? (
                              <span className="text-emerald-600 font-bold uppercase">FREE</span>
                            ) : (
                              `₹${pricing.deliveryFee}`
                            )}
                          </span>
                        </div>

                        <div className="flex justify-between text-slate-600">
                          <span>GST & Govt Taxes (5%)</span>
                          <span>₹{pricing.tax}</span>
                        </div>

                        <div className="border-t border-slate-200/80 pt-2 flex justify-between text-sm font-black text-slate-900">
                          <span>Grand Total</span>
                          <span className="text-base text-emerald-700">₹{pricing.totalAmount}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer CTA */}
              {cartItems.length > 0 && pricing && (
                <div className="p-4 border-t border-slate-100 bg-white">
                  {currentShop && currentShop.is_open === false ? (
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-100 text-slate-400 font-bold text-sm cursor-not-allowed border border-slate-200"
                    >
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                      Store Currently Closed
                    </button>
                  ) : (
                    <button
                      onClick={handleProceedToCheckout}
                      className="w-full flex items-center justify-between px-5 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all cursor-pointer group"
                    >
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-medium text-emerald-100 uppercase">
                          {cartItems.length} items
                        </span>
                        <span className="text-base font-black">₹{pricing.totalAmount}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold">
                        Proceed to Checkout
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
