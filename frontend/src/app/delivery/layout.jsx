"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bike,
  LayoutDashboard,
  Package,
  IndianRupee,
  User,
  Power,
  ShieldAlert,
  ArrowLeft,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";
import socket from "../../lib/socket";
import { useToast } from "../../context/ToastContext";
import PendingApprovalCard from "../../components/PendingApprovalCard";

export default function DeliveryLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/delivery/login") {
    return <>{children}</>;
  }
  const { user, isAuthenticated, isDeliveryPartner, loading, login, logout } = useAuth();
  const { showToast } = useToast();

  const [partnerProfile, setPartnerProfile] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [countdown, setCountdown] = useState(30);

  const [deliveryEmail, setDeliveryEmail] = useState("delivery@store");
  const [deliveryPassword, setDeliveryPassword] = useState("Admin@123");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleDeliveryLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    const res = await login(deliveryEmail, deliveryPassword);
    setLoginLoading(false);
    if (!res.success) {
      setLoginError(res.message);
    } else if (res.user.role !== "DELIVERY_PARTNER") {
      setLoginError("This account does not have Delivery Partner permissions.");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDeliveryProfile();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isDeliveryPartner) && pathname !== "/delivery/login") {
      router.replace("/delivery/login");
    }
  }, [loading, isAuthenticated, isDeliveryPartner, pathname, router]);


  const loadDeliveryProfile = async () => {
    try {
      const res = await apiClient.get("/delivery/profile");
      if (res.data?.success) {
        const p = res.data.data;
        setPartnerProfile(p);
        setIsOnline(p.isOnline);

        // Join delivery socket room
        socket.connect();
        socket.emit("delivery:join", { partnerId: p.id });

        // Listen for new delivery assignment offers (30-second window)
        socket.on("delivery:offer", (offer) => {
          setIncomingOffer(offer);
          setCountdown(30);
          showToast(`⚡ New Delivery Offer: ₹${offer.estimatedEarnings || 45}`, "info");
        });
      }
    } catch (err) {
      console.error("Delivery profile load error", err);
    }
  };

  // 30-second countdown timer for incoming delivery request
  useEffect(() => {
    let timer;
    if (incomingOffer && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (incomingOffer && countdown === 0) {
      // Offer expired
      setIncomingOffer(null);
      showToast("Delivery offer expired and reassigned to next partner", "warning");
    }
    return () => clearInterval(timer);
  }, [incomingOffer, countdown]);

  // GPS Location streaming when online
  useEffect(() => {
    let watchId;
    if (isOnline && partnerProfile?.id && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          socket.emit("delivery:update_location", {
            partnerId: partnerProfile.id,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (err) => console.log("GPS watch error", err),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline, partnerProfile]);

  const toggleOnline = async () => {
    try {
      const nextState = !isOnline;
      const res = await apiClient.put("/delivery/status", { isOnline: nextState });
      if (res.data?.success) {
        setIsOnline(nextState);
        showToast(nextState ? "You are now ONLINE and ready for orders" : "You are now OFFLINE", "success");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  const handleAcceptOffer = async (assignmentId) => {
    try {
      const res = await apiClient.post(`/delivery/assignments/${assignmentId}/accept`);
      if (res.data?.success) {
        showToast("Delivery accepted! Navigate to the store.", "success");
        setIncomingOffer(null);
        router.push(`/delivery/order/${res.data.data?.orderId || incomingOffer.orderId}`);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Offer was already accepted or expired", "error");
      setIncomingOffer(null);
    }
  };

  const handleRejectOffer = async (assignmentId) => {
    try {
      await apiClient.post(`/delivery/assignments/${assignmentId}/reject`);
      setIncomingOffer(null);
      showToast("Offer rejected", "info");
    } catch (err) {
      setIncomingOffer(null);
    }
  };

  const navLinks = [
    { href: "/delivery/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/delivery/orders", label: "Deliveries", icon: Package },
    { href: "/delivery/earnings", label: "Earnings", icon: IndianRupee },
    { href: "/delivery/profile", label: "Rider Profile", icon: User },
  ];

  if (
    !loading &&
    isAuthenticated &&
    isDeliveryPartner &&
    (partnerProfile?.status === "PENDING" ||
      partnerProfile?.isApproved === false ||
      partnerProfile?.is_approved === false ||
      user?.deliveryStatus === "PENDING")
  ) {
    return (
      <PendingApprovalCard
        type="DELIVERY_PARTNER"
        userName={user?.name}
        entityName="Delivery Partner Fleet"
        onRefresh={loadDeliveryProfile}
        onLogout={logout}
      />
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center space-y-3">
        <Bike className="w-10 h-10 text-emerald-500 animate-bounce" />
        <p className="text-xs text-slate-400 font-bold">Verifying rider fleet credentials & active permissions...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isDeliveryPartner) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 space-y-4 text-center">
        <Bike className="w-12 h-12 text-emerald-500 animate-pulse" />
        <h2 className="text-xl font-black text-white">Rider Authentication Required</h2>
        <p className="text-xs text-slate-400 max-w-sm">
          You need an approved Delivery Partner account to access the rider console. Redirecting to login...
        </p>
        <Link
          href="/delivery/login"
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 transition-all"
        >
          Go to Delivery Login
        </Link>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Delivery Header */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
                <Bike className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-sm tracking-tight block">RUCHI STORE</span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                  Delivery Partner App
                </span>
              </div>
            </div>
          </div>

          {/* Online / Offline Toggle Button & Sign Out */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleOnline}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                isOnline
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-slate-800 text-slate-400 border border-slate-700 hover:text-white"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-slate-950 animate-ping" : "bg-red-500"}`} />
              {isOnline ? "Online" : "Offline"}
            </button>

            <button
              onClick={logout}
              title="Sign Out"
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 text-xs font-bold transition-colors cursor-pointer border border-slate-700/60"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 overflow-x-auto border-t border-slate-800 py-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
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

      {/* Main Delivery Partner Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
        <div>{children}</div>

        {/* Delivery Partner Portal Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 DigitalCrowdTech. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span>Rider Desk: support@digitalcrowdtech.in | +91 9985960692</span>
            <a href="https://digitalcrowdtech.in/#" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold hover:underline">
              @digitalcrowdtech
            </a>
          </div>
        </footer>
      </main>

      {/* 30-Second Incoming Delivery Modal */}
      {incomingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border-4 border-emerald-500 space-y-5 animate-bounce-short">
            {/* Header with 30s Countdown */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-600 font-black">
                <Bike className="w-6 h-6 animate-pulse" />
                <span className="text-base uppercase tracking-wider">NEW DELIVERY REQUEST</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 font-black text-sm flex items-center justify-center border-2 border-emerald-500">
                {countdown}s
              </div>
            </div>

            {/* Offer details */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div className="flex justify-between items-center text-slate-800 font-bold">
                <span>Estimated Partner Earnings:</span>
                <span className="text-xl font-black text-emerald-600">
                  ₹{incomingOffer.estimatedEarnings || 45}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 space-y-1.5">
                <p className="text-slate-600">
                  <strong className="text-slate-900">Pickup:</strong> {incomingOffer.shopName || "Ruchi Mart"}
                </p>
                <p className="text-slate-600">
                  <strong className="text-slate-900">Drop:</strong> {incomingOffer.customerAddress || "Madhapur, Hyderabad"}
                </p>
                <p className="text-slate-500">
                  Approx Distance: {incomingOffer.distanceKm || "2.1"} km • 10-15 Min SLA
                </p>
              </div>
            </div>

            {/* Accept / Reject Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleRejectOffer(incomingOffer.assignmentId || incomingOffer.id)}
                className="py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
              >
                Decline
              </button>
              <button
                onClick={() => handleAcceptOffer(incomingOffer.assignmentId || incomingOffer.id)}
                className="py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition-colors cursor-pointer"
              >
                Accept Order ({countdown}s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
