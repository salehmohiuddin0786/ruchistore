"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Search,
  MapPin,
  User,
  Heart,
  Store,
  Bike,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Clock,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

export default function Navbar({ onOpenAuth, onOpenLocation }) {
  const router = useRouter();
  const { user, isAuthenticated, logout, isAdmin, isShopOwner, isDeliveryPartner } = useAuth();
  const { cartCount, cartTotal, setIsCartOpen } = useCart();
  const [selectedLocName, setSelectedLocName] = useState("Madhapur, Hyderabad");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ruchi_delivery_location");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setSelectedLocName(parsed.name || parsed.addressLine1 || parsed.city || "Madhapur, Hyderabad");
        } catch (e) {}
      }
    }
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Animated Search Placeholders
  const placeholders = [
    "Search groceries...",
    "Search fresh fruits & veggies...",
    "Search dairy, milk & curd...",
    "Search snacks & beverages...",
    "Search household essentials...",
    "Search atta, rice & dal...",
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = placeholders[placeholderIndex];
    const typingSpeed = isDeleting ? 40 : 80;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        setDisplayedPlaceholder(current.slice(0, displayedPlaceholder.length + 1));
        if (displayedPlaceholder.length === current.length) {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        setDisplayedPlaceholder(current.slice(0, displayedPlaceholder.length - 1));
        if (displayedPlaceholder.length === 0) {
          setIsDeleting(false);
          setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedPlaceholder, isDeleting, placeholderIndex]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Logo & Delivery Location */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1">
                  RUCHI<span className="text-emerald-600">STORE</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full ml-1 uppercase tracking-wider">
                    ⚡ 10 Min
                  </span>
                </span>
              </div>
            </Link>

            {/* Delivering To */}
            <button
              type="button"
              onClick={onOpenLocation}
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors text-left cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="flex flex-col text-xs leading-tight">
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <span className="truncate max-w-[130px]">{selectedLocName}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
                </span>
                <span className="text-slate-500 font-normal truncate max-w-[150px]">
                  Delivering to your doorstep
                </span>
              </div>
            </button>
          </div>

          {/* Animated Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-xl hidden md:flex items-center relative"
          >
            <div className="w-full relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={displayedPlaceholder}
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 text-sm text-slate-900 transition-all outline-hidden placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3">
            {/* Wishlist Link */}
            <Link
              href="/favorites"
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl text-slate-600 hover:text-rose-500 hover:bg-rose-50 transition-colors"
              title="Favorites"
            >
              <Heart className="w-5 h-5" />
            </Link>

            {/* Cart Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-amber-400 text-slate-900 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-emerald-600"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </div>
              <span className="hidden sm:inline font-bold">
                {cartCount > 0 ? `₹${cartTotal}` : "My Cart"}
              </span>
            </motion.button>

            {/* User Profile / Login */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-2 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 text-sm font-medium transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <span className="hidden lg:inline text-slate-800 max-w-[100px] truncate">
                    {user?.name?.split(" ")[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 text-sm"
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="font-semibold text-slate-900">{user.name}</p>
                        <p className="text-xs text-slate-500 truncate">{user.phone || user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 uppercase">
                          {user.role}
                        </span>
                      </div>

                      <Link
                        href="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                      >
                        <Clock className="w-4 h-4 text-slate-400" />
                        My Orders
                      </Link>

                      <Link
                        href="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>

                      <Link
                        href="/addresses"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" />
                        Saved Addresses
                      </Link>

                      {/* Role-Specific Portals */}
                      {isShopOwner && (
                        <Link
                          href="/shop-owner/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-purple-700 bg-purple-50/50 hover:bg-purple-50 font-semibold transition-colors"
                        >
                          <Store className="w-4 h-4 text-purple-600" />
                          Shop Owner Portal
                        </Link>
                      )}

                      {isDeliveryPartner && (
                        <Link
                          href="/delivery/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-50 font-semibold transition-colors"
                        >
                          <Bike className="w-4 h-4 text-emerald-600" />
                          Delivery Partner Portal
                        </Link>
                      )}

                      {isAdmin && (
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 font-semibold transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-indigo-600" />
                          SuperAdmin Console
                        </Link>
                      )}

                      <div className="border-t border-slate-100 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setUserDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-4 py-2 rounded-xl border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white text-sm font-bold transition-all cursor-pointer"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={displayedPlaceholder}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-100 text-sm text-slate-900 border border-slate-200 outline-hidden"
            />
          </form>
        </div>
      </div>
    </header>
  );
}
