"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ArrowRight, ShieldCheck, Clock, ShoppingBag } from "lucide-react";

export default function HeroBanner() {
  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white shadow-xl mb-10">
      {/* Decorative Glow Orbs */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 sm:py-14 lg:px-12 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left Column: Animated Text */}
        <div className="max-w-xl space-y-4 text-center md:text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-emerald-300"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-bounce" />
            <span>EXPRESS 10-15 MINUTE DELIVERY</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-5xl font-black tracking-tight leading-tight"
          >
            Ruchi Store. <br />
            <span className="bg-gradient-to-r from-white via-slate-100 to-emerald-300 bg-clip-text text-transparent">
              Everything you need.
            </span>
            <br />
            <span className="text-emerald-400 font-extrabold">Delivered to your door.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-slate-300 text-sm sm:text-base font-normal max-w-md leading-relaxed"
          >
            Fresh farm vegetables, dairy, snacks, cold beverages, and daily household essentials
            from your favorite local neighborhood shops.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-4"
          >
            <Link
              href="/categories"
              className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 group cursor-pointer"
            >
              <span>Shop All Groceries</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="/offers"
              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-white font-bold text-sm transition-colors"
            >
              View Deals &amp; Offers
            </Link>
          </motion.div>
        </div>

        {/* Right Column: Visual Feature Badges */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 gap-3.5 w-full max-w-sm"
        >
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-left">
            <Clock className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="font-bold text-sm text-white">10-15 Min</h4>
            <p className="text-xs text-slate-300">Ultra-fast local delivery</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-left">
            <ShoppingBag className="w-6 h-6 text-indigo-400 mb-2" />
            <h4 className="font-bold text-sm text-white">3,000+ Items</h4>
            <p className="text-xs text-slate-300">Everything in stock</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-left">
            <ShieldCheck className="w-6 h-6 text-amber-400 mb-2" />
            <h4 className="font-bold text-sm text-white">Farm Quality</h4>
            <p className="text-xs text-slate-300">100% genuine products</p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-left">
            <Zap className="w-6 h-6 text-rose-400 mb-2" />
            <h4 className="font-bold text-sm text-white">Zero Extra Fee</h4>
            <p className="text-xs text-slate-300">Free delivery on ₹299+</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
