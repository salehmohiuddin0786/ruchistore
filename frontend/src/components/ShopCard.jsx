"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Zap, MapPin, Store, ArrowRight } from "lucide-react";
import { isShopOpen } from "../lib/shopUtils";

export default function ShopCard({ shop }) {
  const isOpen = isShopOpen(shop);
  const coverImage = shop.cover_image || shop.coverImage || shop.bannerImage || shop.logo;
  const eta = shop.estimated_delivery_time || shop.estimatedDeliveryTime || "15-20 min";
  const minOrder = shop.minimum_order ?? shop.minimumOrder ?? 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-slate-200 shadow-2xs hover:shadow-xl transition-all flex flex-col justify-between"
    >
      <div>
        {/* Cover Image */}
        <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
          {coverImage ? (
            <Image
              src={coverImage}
              alt={shop.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-300">
              <Store className="w-12 h-12" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl text-xs font-bold shadow-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                isOpen ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span className={isOpen ? "text-emerald-700" : "text-slate-500"}>
              {isOpen ? "Open Now" : "Closed"}
            </span>
          </div>

          {/* Delivery ETA Badge */}
          <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-md">
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>{eta}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
              {shop.name}
            </h3>
            <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 text-xs font-black px-2 py-0.5 rounded-lg shrink-0">
              <Star className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
              <span>{shop.rating || "4.8"}</span>
            </div>
          </div>

          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {shop.description || "Groceries, daily essentials, fresh dairy and pantry items."}
          </p>

          <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {shop.distance || "1.2 km"}
            </span>
            <span>•</span>
            <span>Min. Order: ₹{shop.minimum_order || 0}</span>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-0">
        <Link
          href={`/shop/${shop.id}`}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-100 hover:bg-emerald-600 text-slate-700 hover:text-white font-bold text-xs transition-colors group/btn cursor-pointer"
        >
          <span>Visit Shop</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
