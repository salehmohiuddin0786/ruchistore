"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Store,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  IndianRupee,
  Settings,
  Tag,
  ArrowLeft,
  LogOut,
  Sparkles,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";
import socket from "../../lib/socket";
import { useToast } from "../../context/ToastContext";

export default function ShopOwnerLayout({ children }) {
  const pathname = usePathname();

  const {
    user,
    isAuthenticated,
    isShopOwner,
    loading,
    login,
    logout,
  } = useAuth();

  const { showToast } = useToast();

  const [shop, setShop] = useState(null);
  const [isOpen, setIsOpen] = useState(true);

  const [ownerEmail, setOwnerEmail] = useState("owner@store");
  const [ownerPassword, setOwnerPassword] = useState("Admin@123");

  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  /* =========================================================
     OWNER LOGIN
  ========================================================= */

  const handleOwnerLogin = async (e) => {
    e.preventDefault();

    setLoginLoading(true);
    setLoginError("");

    try {
      const result = await login(ownerEmail, ownerPassword);

      if (!result?.success) {
        setLoginError(result?.message || "Login failed.");
        return;
      }

      if (result?.user?.role !== "SHOP_OWNER") {
        setLoginError(
          "This account does not have Shop Owner permissions."
        );
        return;
      }
    } catch (error) {
      console.error("Shop owner login error:", error);

      setLoginError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to login."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  /* =========================================================
     LOAD SHOP INFORMATION
  ========================================================= */

  const loadShopInfo = async () => {
    try {
      console.log("Loading shop information...");

      const response = await apiClient.get("/shop-owner/shop");

      console.log("Shop API response:", response?.data);

      if (!response?.data?.success) {
        console.warn(
          "Shop API returned unsuccessful response:",
          response?.data
        );
        return;
      }

      const shopData = response?.data?.data;

      if (!shopData) {
        console.warn("Shop API returned no shop data.");
        return;
      }

      setShop(shopData);
      setIsOpen(Boolean(shopData?.isOpen));

      /* =====================================================
         SOCKET CONNECTION
      ===================================================== */

      if (shopData?.id) {
        try {
          socket.connect();

          socket.emit("shop:join", {
            shopId: shopData.id,
          });

          // Prevent duplicate listeners
          socket.off("shop:new_order");

          socket.on("shop:new_order", (order) => {
            showToast(
              `🔔 New Order Received: #${
                order?.orderNumber ||
                order?.id ||
                "New"
              } (₹${order?.totalAmount || 0})`,
              "info"
            );
          });
        } catch (socketError) {
          console.error(
            "Socket connection error:",
            socketError
          );
        }
      }
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      console.error("❌ Shop information request failed:", {
        status,
        data,
        message: error?.message,
      });

      /* =====================================================
         SESSION EXPIRED
      ===================================================== */

      if (status === 401) {
        showToast(
          "Your session has expired. Please sign in again.",
          "error"
        );

        logout();
        return;
      }

      /* =====================================================
         FORBIDDEN
      ===================================================== */

      if (status === 403) {
        showToast(
          "This account does not have Shop Owner permission.",
          "error"
        );

        return;
      }

      /* =====================================================
         OTHER ERRORS
      ===================================================== */

      showToast(
        data?.message ||
          "Unable to load shop information.",
        "error"
      );
    }
  };

  /* =========================================================
     LOAD SHOP WHEN AUTHENTICATED
  ========================================================= */

  useEffect(() => {
    if (!loading && isAuthenticated && isShopOwner) {
      loadShopInfo();
    }
  }, [loading, isAuthenticated, isShopOwner]);

  /* =========================================================
     CLEANUP SOCKET
  ========================================================= */

  useEffect(() => {
    return () => {
      socket.off("shop:new_order");
    };
  }, []);

  /* =========================================================
     TOGGLE SHOP STATUS
  ========================================================= */

  const toggleStoreStatus = async () => {
    const nextState = !isOpen;

    try {
      const response = await apiClient.put(
        "/shop-owner/shop/status",
        {
          isOpen: nextState,
        }
      );

      if (response?.data?.success) {
        setIsOpen(nextState);

        showToast(
          nextState
            ? "Store is now OPEN for customer orders"
            : "Store is now CLOSED",
          "success"
        );
      } else {
        showToast(
          response?.data?.message ||
            "Unable to update store status.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Store status update error:",
        error?.response?.data || error
      );

      showToast(
        error?.response?.data?.message ||
          "Unable to update store status.",
        "error"
      );
    }
  };

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const navLinks = [
    {
      href: "/shop-owner/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/shop-owner/orders",
      label: "Orders",
      icon: ShoppingBag,
    },
    {
      href: "/shop-owner/products",
      label: "Products",
      icon: Package,
    },
    {
      href: "/shop-owner/inventory",
      label: "Inventory",
      icon: Layers,
    },
    {
      href: "/shop-owner/shop",
      label: "My Store",
      icon: Store,
    },
    {
      href: "/shop-owner/coupons",
      label: "Coupons",
      icon: Tag,
    },
    {
      href: "/shop-owner/earnings",
      label: "Earnings",
      icon: IndianRupee,
    },
    {
      href: "/shop-owner/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  /* =========================================================
     LOGIN SCREEN
  ========================================================= */

  if (
    !loading &&
    (!isAuthenticated || !isShopOwner)
  ) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-600/30">
              <Store className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-xl font-black text-white">
                Shop Owner Portal
              </h1>

              <p className="text-xs text-slate-400">
                Ruchi Mart Store Management
              </p>
            </div>
          </div>

          {/* Demo Credentials */}
          <div className="bg-purple-950/40 border border-purple-800/40 rounded-2xl p-4 text-xs space-y-1.5">

            <p className="font-bold text-purple-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />

              Standard Shop Owner Credentials
            </p>

            <p className="text-slate-300 font-mono">
              Mail:{" "}
              <strong className="text-white">
                owner@store
              </strong>
            </p>

            <p className="text-slate-300 font-mono">
              Pass:{" "}
              <strong className="text-white">
                Admin@123
              </strong>
            </p>
          </div>

          {/* Login Form */}
          <form
            onSubmit={handleOwnerLogin}
            className="space-y-4"
          >
            {loginError && (
              <p className="text-xs font-semibold text-rose-400 bg-rose-950/50 p-3 rounded-xl border border-rose-800/50">
                {loginError}
              </p>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Owner Username / Email
              </label>

              <input
                type="text"
                value={ownerEmail}
                onChange={(e) =>
                  setOwnerEmail(e.target.value)
                }
                className="w-full px-4 py-3 rounded-xl bg-slate-700/80 border border-slate-600 text-white font-medium text-sm outline-hidden focus:border-purple-400"
                placeholder="owner@store"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>

              <input
                type="password"
                value={ownerPassword}
                onChange={(e) =>
                  setOwnerPassword(e.target.value)
                }
                className="w-full px-4 py-3 rounded-xl bg-slate-700/80 border border-slate-600 text-white font-medium text-sm outline-hidden focus:border-purple-400"
                placeholder="••••••••"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loginLoading
                ? "Authenticating..."
                : "Sign In to Shop Owner Portal"}
            </button>
          </form>

          {/* Back */}
          <div className="pt-2 text-center">
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Customer Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     SHOP OWNER PORTAL
  ========================================================= */

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">

      {/* =====================================================
          TOP BAR
      ===================================================== */}

      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* Logo / Shop */}
          <div className="flex items-center gap-3">

            <Link
              href="/"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-2">

              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
                <Store className="w-5 h-5" />
              </div>

              <div>
                <span className="font-black text-sm tracking-tight block">
                  {shop?.name || "RUCHI STORE"}
                </span>

                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                  Shop Owner Portal
                </span>
              </div>

            </div>
          </div>

          {/* Store Status + Logout */}
          <div className="flex items-center gap-2.5">

            <button
              onClick={toggleStoreStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                isOpen
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isOpen
                    ? "bg-slate-950 animate-ping"
                    : "bg-red-500"
                }`}
              />

              {isOpen
                ? "Store Open"
                : "Store Closed"}
            </button>

            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 text-xs font-bold transition-colors cursor-pointer border border-slate-700/60"
            >
              <LogOut className="w-3.5 h-3.5" />

              <span className="hidden sm:inline">
                Sign Out
              </span>
            </button>

          </div>
        </div>

        {/* Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto border-t border-slate-800 py-1.5">

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                  isActive
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}

        </div>
      </header>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between">

        <div>
          {children}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">

          <p>
            © 2026 DigitalCrowdTech. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-4">

            <span>
              Support: support@digitalcrowdtech.in |
              +91 9985960692
            </span>

            <a
              href="https://digitalcrowdtech.in/#"
              target="_blank"
              rel="noreferrer"
              className="text-purple-600 font-bold hover:underline"
            >
              @digitalcrowdtech
            </a>

          </div>
        </footer>

      </main>
    </div>
  );
}