"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, Search, Clock, ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount, setIsCartOpen } = useCart();

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "Categories", href: "/categories", icon: Layers },
    { label: "Search", href: "/search", icon: Search },
    { label: "Orders", href: "/orders", icon: Clock },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 shadow-lg px-2 py-1.5 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
              isActive ? "text-indigo-600 font-bold" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.75]"}`} />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </Link>
        );
      })}

      {/* Cart Trigger */}
      <button
        onClick={() => setIsCartOpen(true)}
        className="flex flex-col items-center py-1 px-3 rounded-xl text-slate-700 relative cursor-pointer"
      >
        <div className="relative">
          <ShoppingBag className="w-5 h-5 stroke-[2] text-emerald-600" />
          {cartCount > 0 && (
            <span className="absolute -top-1.5 -right-2.5 bg-emerald-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 font-semibold text-emerald-600">Cart</span>
      </button>
    </div>
  );
}
