"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Minus, Heart, ShoppingBag, Clock } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/apiClient";
import { useToast } from "../context/ToastContext";

export default function ProductCard({ product }) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [isWishlisted, setIsWishlisted] = useState(false);

  // Check if item is already in cart
  const cartItem = cartItems.find(
    (item) =>
      item.product?.id === product.id ||
      item.product_id === product.id ||
      item.productId === product.id ||
      item.id === product.id
  );
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const price = parseFloat(product.price);
  const discountPrice = product.discount_price ? parseFloat(product.discount_price) : null;
  const effectivePrice = discountPrice || price;

  const discountPercent = discountPrice
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      showToast("Please sign in to save favorite items", "info");
      return;
    }

    try {
      const res = await apiClient.post("/favorites/product", { productId: product.id });
      setIsWishlisted(res.data.isFavorite);
      showToast(res.data.message);
    } catch (err) {
      showToast("Could not update favorites", "error");
    }
  };

  const isShopClosed = Boolean(product.shop && (product.shop.is_open === false || product.shop.isOpen === false));

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isShopClosed) {
      showToast("This store is currently closed and not accepting orders", "warning");
      return;
    }
    addToCart(product, 1);
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      updateQuantity(cartItem.id || cartItem.product_id || product.id, quantityInCart + 1);
    }
  };

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartItem) {
      updateQuantity(cartItem.id || cartItem.product_id || product.id, quantityInCart - 1);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group relative bg-white rounded-3xl p-3.5 border border-slate-100 hover:border-slate-200 shadow-2xs hover:shadow-xl transition-all flex flex-col justify-between"
    >
      <div>
        {/* Image & Badges Container */}
        <Link href={`/product/${product.id}`} className="block relative aspect-square w-full rounded-2xl bg-slate-50 overflow-hidden mb-3">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <ShoppingBag className="w-12 h-12" />
            </div>
          )}

          {/* Discount Badge */}
          {discountPercent > 0 && (
            <span className="absolute top-2.5 left-2.5 bg-rose-600 text-white text-[11px] font-black px-2 py-0.5 rounded-lg shadow-sm">
              {discountPercent}% OFF
            </span>
          )}

          {/* 10-15 Min Delivery Tag */}
          <span className="absolute bottom-2.5 left-2.5 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
            <Clock className="w-3 h-3 text-emerald-600" />
            {product.shop?.estimated_delivery_time || "10-15 min"}
          </span>

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className={`absolute top-2.5 right-2.5 p-1.5 rounded-full backdrop-blur-md transition-colors ${
              isWishlisted
                ? "bg-rose-50 text-rose-600"
                : "bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white"
            }`}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
          </button>
        </Link>

        {/* Product Details */}
        <Link href={`/product/${product.id}`} className="block">
          <span className="text-[11px] font-semibold text-slate-400 block truncate">
            {product.unit_value || product.unit}
          </span>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mt-0.5">
            {product.name}
          </h3>
        </Link>
      </div>

      {/* Price & Add to Cart Action */}
      <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between">
        <div>
          <span className="text-base font-black text-slate-900">₹{effectivePrice}</span>
          {discountPrice && (
            <span className="text-xs text-slate-400 line-through ml-1.5 font-medium">
              ₹{price}
            </span>
          )}
        </div>

        {/* Quantity or Add Button */}
        {isShopClosed ? (
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-[11px] uppercase tracking-wider select-none">
            Store Closed
          </span>
        ) : quantityInCart > 0 ? (
          <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 p-0.5 rounded-xl">
            <button
              onClick={handleDecrement}
              className="w-7 h-7 rounded-lg bg-white text-emerald-700 font-bold flex items-center justify-center hover:bg-emerald-100 shadow-2xs text-xs"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-black text-emerald-900 w-4 text-center">
              {quantityInCart}
            </span>
            <button
              onClick={handleIncrement}
              className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center hover:bg-emerald-700 shadow-2xs text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleAdd}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-transparent text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            ADD
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
