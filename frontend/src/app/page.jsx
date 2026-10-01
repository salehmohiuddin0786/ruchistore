"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Flame,
  TrendingUp,
  Store,
  Clock,
  ArrowRight,
  ShieldCheck,
  Tag,
  Zap,
  ShoppingBag,
  Award,
  Percent,
} from "lucide-react";
import apiClient from "../api/apiClient";
import HeroBanner from "../components/HeroBanner";
import CategorySlider from "../components/CategorySlider";
import ProductCard from "../components/ProductCard";
import ShopCard from "../components/ShopCard";
import { useCart } from "../context/CartContext";

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [dealProducts, setDealProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [nearbyShops, setNearbyShops] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  const { applyCoupon } = useCart();

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const [catRes, prodRes, shopRes, couponRes] = await Promise.allSettled([
        apiClient.get("/categories"),
        apiClient.get("/products?limit=24"),
        apiClient.get("/shops?limit=6"),
        apiClient.get("/coupons"),
      ]);

      if (catRes.status === "fulfilled" && catRes.value.data?.success) {
        const raw = catRes.value.data.data;
        setCategories(Array.isArray(raw) ? raw : (raw?.categories || []));
      }

      if (prodRes.status === "fulfilled" && prodRes.value.data?.success) {
        const prods = prodRes.value.data.data?.products || [];
        const isBestseller = (p) => Boolean(p.is_bestseller ?? p.isBestseller);
        const isFeatured = (p) => Boolean(p.is_featured ?? p.isFeatured);
        const getDiscountPrice = (p) => (p.discount_price != null ? Number(p.discount_price) : (p.discountPrice != null ? Number(p.discountPrice) : null));
        const getPrice = (p) => Number(p.price || 0);

        setPopularProducts(prods.filter((p) => isFeatured(p) || Number(p.rating || 0) >= 4.5).slice(0, 8));

        const best = prods.filter((p) => isBestseller(p) || Number(p.total_sold ?? p.totalSold ?? 0) > 0);
        setBestSellers(best.length > 0 ? best.slice(0, 8) : prods.slice(0, 8));

        const deals = prods.filter((p) => {
          const dp = getDiscountPrice(p);
          return dp !== null && dp > 0 && dp < getPrice(p);
        });
        setDealProducts(deals.length > 0 ? deals.slice(0, 8) : prods.slice(0, 8));

        setRecommendedProducts(prods.slice(0, 8));
      }

      if (shopRes.status === "fulfilled" && shopRes.value.data?.success) {
        setNearbyShops(shopRes.value.data.data?.shops || []);
      }

      if (couponRes.status === "fulfilled" && couponRes.value.data?.success) {
        setCoupons(couponRes.value.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch home page data", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 space-y-10 pb-16">
      {/* Hero Banner Carousel */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <HeroBanner />
      </section>

      {/* Zepto Speed Guarantee Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 rounded-3xl p-4 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <Zap className="w-8 h-8 text-amber-300 animate-pulse" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-widest bg-emerald-800/60 px-2.5 py-0.5 rounded-full inline-block mb-1">
                Hyperlocal Delivery
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Everything you need. Delivered to your door.
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 font-medium">
                Fresh fruits, organic veggies, daily dairy & pantry staples from trusted local shops in 10-15 mins.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/shops"
              className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs sm:text-sm transition-all shadow-md hover:scale-105 active:scale-95"
            >
              Explore Nearby Stores
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Shop by Category */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-indigo-600" />
              Shop by Category
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Explore 16+ departments of daily essentials
            </p>
          </div>
          <Link
            href="/categories"
            className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            See All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <CategorySlider categories={categories} />
      </section>

      {/* Promotional Offers & Coupons */}
      {coupons.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Percent className="w-6 h-6 text-rose-500" />
                Special Offers & Coupons
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Apply promo codes during checkout for instant discounts
              </p>
            </div>
            <Link
              href="/offers"
              className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              All Offers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coupons.slice(0, 3).map((coupon) => (
              <motion.div
                key={coupon.id}
                whileHover={{ y: -3 }}
                className="p-4 rounded-3xl bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/50 border border-indigo-100/80 shadow-xs flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-indigo-700 bg-indigo-100/80 px-2.5 py-1 rounded-xl text-xs tracking-wider border border-indigo-200">
                      {coupon.code}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {coupon.discountType === "PERCENTAGE"
                        ? `${coupon.discountValue}% OFF`
                        : `₹${coupon.discountValue} FLAT OFF`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium pt-1">
                    {coupon.description || `Min order ₹${coupon.minOrderAmount || 199}`}
                  </p>
                </div>
                <button
                  onClick={() => applyCoupon(coupon.code)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors shrink-0"
                >
                  Apply
                </button>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Deals of the Day */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Flame className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Deals of the Day
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Biggest price drops on everyday favorites
              </p>
            </div>
          </div>
          <Link
            href="/search?discount=true"
            className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            View Deals <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {dealProducts.length > 0
            ? dealProducts.map((p) => <ProductCard key={p.id} product={p} />)
            : Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-3xl bg-slate-200/60 animate-pulse" />
              ))}
        </div>
      </section>

      {/* Popular Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Popular Products
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Most ordered grocery items in your locality
              </p>
            </div>
          </div>
          <Link
            href="/search?popular=true"
            className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {popularProducts.length > 0
            ? popularProducts.map((p) => <ProductCard key={p.id} product={p} />)
            : Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-3xl bg-slate-200/60 animate-pulse" />
              ))}
        </div>
      </section>

      {/* Nearby Partner Shops */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Nearby Partner Shops
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Order directly from verified grocery supermarkets in your neighborhood
              </p>
            </div>
          </div>
          <Link
            href="/shops"
            className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            All Stores <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {nearbyShops.length > 0
            ? nearbyShops.map((shop) => <ShopCard key={shop.id} shop={shop} />)
            : Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 rounded-3xl bg-slate-200/60 animate-pulse" />
              ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Best Sellers
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Top rated staples, fresh milk, daily dairy & snacks
              </p>
            </div>
          </div>
          <Link
            href="/search?bestseller=true"
            className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            View More <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {bestSellers.length > 0
            ? bestSellers.map((p) => <ProductCard key={p.id} product={p} />)
            : Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-3xl bg-slate-200/60 animate-pulse" />
              ))}
        </div>
      </section>

      {/* Recommended For You */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Recommended For You
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Handpicked essentials curated for your household
              </p>
            </div>
          </div>
          <Link
            href="/search"
            className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            See All <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {recommendedProducts.length > 0
            ? recommendedProducts.map((p) => <ProductCard key={p.id} product={p} />)
            : Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-3xl bg-slate-200/60 animate-pulse" />
              ))}
        </div>
      </section>
    </div>
  );
}
