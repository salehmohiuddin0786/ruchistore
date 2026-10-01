"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Apple,
  Carrot,
  Milk,
  Croissant,
  Wheat,
  Coffee,
  Cookie,
  Sparkles,
  Home,
  Heart,
  Droplets,
  Package,
  Flame,
  ArrowRight,
} from "lucide-react";
import apiClient from "../../api/apiClient";

const ICON_MAP = {
  fruits: Apple,
  vegetables: Carrot,
  dairy: Milk,
  bakery: Croissant,
  "rice-grains": Wheat,
  "dal-pulses": Package,
  "oil-masala": Flame,
  snacks: Cookie,
  beverages: Coffee,
  biscuits: Cookie,
  chocolates: Heart,
  "personal-care": Sparkles,
  household: Home,
  cleaning: Droplets,
  "baby-care": Heart,
  "pet-care": Heart,
};

const COLOR_MAP = {
  fruits: "from-red-500/10 to-orange-500/10 text-red-600 border-red-200/60",
  vegetables: "from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-200/60",
  dairy: "from-blue-500/10 to-cyan-500/10 text-blue-600 border-blue-200/60",
  bakery: "from-amber-500/10 to-yellow-500/10 text-amber-700 border-amber-200/60",
  "rice-grains": "from-yellow-500/10 to-lime-500/10 text-yellow-700 border-yellow-200/60",
  "dal-pulses": "from-orange-500/10 to-amber-500/10 text-orange-700 border-orange-200/60",
  "oil-masala": "from-red-500/10 to-rose-500/10 text-rose-600 border-rose-200/60",
  snacks: "from-amber-500/10 to-orange-500/10 text-amber-600 border-amber-200/60",
  beverages: "from-cyan-500/10 to-blue-500/10 text-cyan-700 border-cyan-200/60",
  biscuits: "from-amber-500/10 to-yellow-500/10 text-amber-700 border-amber-200/60",
  chocolates: "from-pink-500/10 to-rose-500/10 text-pink-600 border-pink-200/60",
  "personal-care": "from-purple-500/10 to-indigo-500/10 text-purple-600 border-purple-200/60",
  household: "from-slate-500/10 to-slate-600/10 text-slate-700 border-slate-200/60",
  cleaning: "from-sky-500/10 to-blue-500/10 text-sky-600 border-sky-200/60",
  "baby-care": "from-rose-500/10 to-pink-500/10 text-rose-500 border-rose-200/60",
  "pet-care": "from-emerald-500/10 to-lime-500/10 text-emerald-700 border-emerald-200/60",
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/categories");
      if (res.data?.success) {
        const raw = res.data.data;
        setCategories(Array.isArray(raw) ? raw : (raw?.categories || []));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          All Grocery Departments
        </h1>
        <p className="text-sm text-slate-500">
          Pick a category to browse farm-fresh essentials, snacks, dairy and daily staples
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-44 rounded-3xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {categories.map((cat, idx) => {
            const Icon = ICON_MAP[cat.slug] || Package;
            const colorClass =
              COLOR_MAP[cat.slug] ||
              "from-indigo-500/10 to-purple-500/10 text-indigo-600 border-indigo-200/60";

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.03, duration: 0.25 }}
                whileHover={{ y: -4 }}
              >
                <Link
                  href={`/category/${cat.slug || cat.id}`}
                  className="flex flex-col items-center justify-between p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all text-center h-48 group cursor-pointer"
                >
                  <div
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-b ${colorClass} border flex items-center justify-center p-3 group-hover:scale-105 transition-transform duration-300`}
                  >
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                    ) : null}
                    <Icon className={`w-10 h-10 ${cat.image ? "hidden" : "block"}`} />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {cat.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1 mt-1 group-hover:text-slate-600">
                      Explore <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
