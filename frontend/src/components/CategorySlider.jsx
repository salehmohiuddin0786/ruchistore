"use client";

import React, { useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
  Flame,
} from "lucide-react";

// Fallback icon mapping for quick-commerce categories
const categoryIconMap = {
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

const categoryColorMap = {
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

export default function CategorySlider({ categories = [] }) {
  const scrollRef = useRef(null);

  const list = Array.isArray(categories)
    ? categories
    : Array.isArray(categories?.categories)
    ? categories.categories
    : [];

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  if (!list || list.length === 0) return null;

  return (
    <div className="relative group py-2">
      {/* Scroll controls */}
      <button
        onClick={() => scroll("left")}
        className="hidden md:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white shadow-lg border border-slate-100 text-slate-700 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={() => scroll("right")}
        className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 items-center justify-center rounded-full bg-white shadow-lg border border-slate-100 text-slate-700 hover:bg-slate-50 transition-all opacity-0 group-hover:opacity-100"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Categories track */}
      <div
        ref={scrollRef}
        className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {list.map((cat, idx) => {
          const Icon = categoryIconMap[cat.slug] || Package;
          const colorClass =
            categoryColorMap[cat.slug] ||
            "from-indigo-500/10 to-purple-500/10 text-indigo-600 border-indigo-200/60";

          return (
            <motion.div
              key={cat.id || idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.3 }}
              className="shrink-0"
            >
              <Link
                href={`/category/${cat.slug || cat.id}`}
                className="flex flex-col items-center gap-2 group/card w-20 sm:w-24 text-center cursor-pointer"
              >
                <div
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-b ${colorClass} border flex items-center justify-center p-3 transition-all duration-300 group-hover/card:scale-105 group-hover/card:shadow-md relative overflow-hidden`}
                >
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-full h-full object-contain drop-shadow-sm group-hover/card:scale-110 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "block";
                      }}
                    />
                  ) : null}
                  <Icon
                    className={`w-8 h-8 sm:w-10 sm:h-10 transition-transform duration-300 group-hover/card:scale-110 ${
                      cat.image ? "hidden" : "block"
                    }`}
                  />
                </div>
                <span className="text-xs sm:text-xs font-semibold text-slate-800 line-clamp-2 leading-tight group-hover/card:text-indigo-600 transition-colors">
                  {cat.name}
                </span>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
