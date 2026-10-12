"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  CreditCard,
  Banknote,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Store,
  Tag,
  Clock,
  Plus,
  Home,
  Briefcase,
  AlertCircle,
  X,
  Crosshair,
  Phone,
  User,
  Gift,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import apiClient from "../../api/apiClient";
import { isShopOpen } from "../../lib/shopUtils";
import AuthModal from "../../components/AuthModal";
import { getCurrentGeoAddress } from "../../lib/geo";
import ProtectedRoute from "../../components/ProtectedRoute";

// Helper to load Razorpay SDK dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items = [],
    shop,
    cartTotal,
    cartSubtotal,
    couponDiscount,
    deliveryFee,
    taxAmount,
    couponCode,
    appliedCoupon,
    clearCart,
    loading,
    initialLoaded,
    fetchCart,
  } = useCart();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [deliveryInstructions, setDeliveryInstructions] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD"); // 'COD' | 'ONLINE'
  const [submitting, setSubmitting] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Ordering for someone else state
  const [isOrderingForOther, setIsOrderingForOther] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  // Inline Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: "",
    phone: "",
    house_flat: "",
    address_line: "",
    landmark: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500081",
    type: "HOME",
    is_default: true,
    latitude: null,
    longitude: null,
  });

  // Sync default user name/phone into address form when available
  useEffect(() => {
    if (user) {
      setNewAddress((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        phone: prev.phone || (user.phone && !user.phone.startsWith("g_") ? user.phone : ""),
      }));
    }
  }, [user]);

  useEffect(() => {
    if (fetchCart) {
      fetchCart();
    }
  }, [fetchCart]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
    }
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const res = await apiClient.get("/addresses");
      if (res.data?.success) {
        const raw = res.data.data;
        const addrs = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.addresses)
          ? raw.addresses
          : Array.isArray(res.data?.addresses)
          ? res.data.addresses
          : [];
        setAddresses(addrs);
        const defaultAddr = addrs.find((a) => a.isDefault || a.is_default) || addrs[0];
        if (defaultAddr && !selectedAddressId) {
          setSelectedAddressId(defaultAddr.id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      setDetectingGps(true);
      showToast("Fetching your current GPS location...", "info");
      const geo = await getCurrentGeoAddress();
      setNewAddress((prev) => ({
        ...prev,
        address_line: geo.addressLine || prev.address_line,
        city: geo.city || prev.city,
        state: geo.state || prev.state,
        pincode: geo.pincode || prev.pincode,
        latitude: geo.latitude,
        longitude: geo.longitude,
      }));
      showToast(`Location detected: ${geo.addressLine || geo.city}`, "success");
    } catch (err) {
      showToast(err.message || "Failed to detect location", "warning");
    } finally {
      setDetectingGps(false);
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!newAddress.name?.trim()) {
      showToast("Please enter recipient name", "error");
      return;
    }
    const cleanPhone = String(newAddress.phone || "").replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      showToast("Please enter a valid 10-digit mobile number", "error");
      return;
    }
    if (!newAddress.address_line.trim() || !newAddress.pincode.trim()) {
      showToast("Please enter street address and pincode", "error");
      return;
    }
    try {
      setSavingAddress(true);
      const res = await apiClient.post("/addresses", {
        ...newAddress,
        phone: cleanPhone.slice(-10),
      });
      if (res.data?.success) {
        showToast("Address added successfully!", "success");
        setIsAddressModalOpen(false);
        const createdId = res.data.data?.id || res.data.address?.id;
        setNewAddress({
          name: user?.name || "",
          phone: user?.phone && !user.phone.startsWith("g_") ? user.phone : "",
          house_flat: "",
          address_line: "",
          landmark: "",
          city: "Hyderabad",
          state: "Telangana",
          pincode: "500081",
          type: "HOME",
          is_default: true,
          latitude: null,
          longitude: null,
        });
        await loadAddresses();
        if (createdId) {
          setSelectedAddressId(createdId);
        }
      } else {
        showToast(res.data?.message || "Failed to save address", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Error saving address", "error");
    } finally {
      setSavingAddress(false);
    }
  };

  if (loading || authLoading || (initialLoaded === false && items.length === 0)) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Loading your checkout details...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Your cart is empty</h2>
        <p className="text-xs text-slate-500">
          Please add items from your nearby grocery store before checking out.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
        >
          Browse Groceries
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      showToast("Please sign in to place your order", "warning");
      setIsAuthModalOpen(true);
      return;
    }

    if (!selectedAddressId) {
      showToast("Please select or add a delivery address", "error");
      setIsAddressModalOpen(true);
      return;
    }

    const orderItems = items
      .map((i) => {
        const prodId = i.product?.id || i.product_id || i.productId || i.id;
        return {
          productId: Number(prodId),
          id: Number(prodId),
          quantity: Number(i.quantity) || 1,
        };
      })
      .filter((i) => Boolean(i.productId));

    if (orderItems.length === 0) {
      showToast("Your cart is empty. Please add items to order.", "error");
      return;
    }

    if (isOrderingForOther) {
      if (!recipientName.trim()) {
        showToast("Please enter recipient name (person taking the parcel)", "error");
        return;
      }
      const cleanRecPhone = String(recipientPhone || "").replace(/\D/g, "");
      if (cleanRecPhone.length < 10) {
        showToast("Please enter a valid 10-digit mobile number for the recipient", "error");
        return;
      }
    }

    try {
      setSubmitting(true);

      if (paymentMethod === "ONLINE") {
        await loadRazorpayScript();
      }

      const activeShopId =
        shop?.id ||
        items[0]?.product?.shop_id ||
        items[0]?.product?.shopId ||
        items[0]?.shop_id ||
        items[0]?.shopId;

      const payload = {
        items: orderItems,
        shopId: activeShopId,
        addressId: selectedAddressId,
        paymentMethod: paymentMethod === "ONLINE" ? "RAZORPAY" : paymentMethod,
        couponCode:
          appliedCoupon?.code ||
          (typeof appliedCoupon === "string" ? appliedCoupon : null) ||
          couponCode ||
          null,
        deliveryInstructions,
        recipientName: isOrderingForOther ? recipientName.trim() : null,
        recipientPhone: isOrderingForOther ? String(recipientPhone).replace(/\D/g, "").slice(-10) : null,
        isForOther: isOrderingForOther,
      };

      const res = await apiClient.post("/orders", payload);
      if (res.data?.success) {
        const orderData = res.data.data?.order || res.data.data;
        const orderId = orderData?.id || res.data.data?.id;

        // Check if Razorpay payment is triggered
        const rzpData = res.data.data?.razorpay;
        if (
          payload.paymentMethod === "RAZORPAY" &&
          rzpData &&
          typeof window !== "undefined" &&
          window.Razorpay &&
          !rzpData.key?.includes("placeholder")
        ) {
          const rzpOptions = {
            key: rzpData.key,
            amount: rzpData.amount,
            currency: "INR",
            name: "Ruchi Store",
            description: `Order #${orderData?.orderNumber || orderId}`,
            order_id: rzpData.orderId,
            handler: async function (response) {
              try {
                await apiClient.post("/payments/verify", {
                  orderId: orderId,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpayOrderId: response.razorpay_order_id,
                  razorpaySignature: response.razorpay_signature,
                });
              } catch (e) {
                console.error("Payment verification notice:", e);
              }
              showToast("Payment successful & order placed!", "success");
              clearCart();
              router.push(`/order-success/${orderId}`);
            },
            prefill: {
              name: user?.name || "",
              email: user?.email || "",
              contact: user?.phone || "",
            },
            theme: { color: "#059669" },
          };
          const rzp = new window.Razorpay(rzpOptions);
          rzp.open();
          return;
        }

        showToast("Order placed successfully!", "success");
        clearCart();
        router.push(`/order-success/${orderId}`);
      } else {
        showToast(res.data?.message || "Failed to place order", "error");
      }
    } catch (err) {
      console.error("Order error", err);
      showToast(
        err.response?.data?.message || "Error creating order. Please check stock.",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute
      title="Checkout"
      description="Please sign in to select your delivery address and complete your grocery order."
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Checkout</h1>
          <p className="text-xs text-slate-500">
            Confirm your delivery address and payment to receive order in 10-15 mins
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Address & Payment) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Delivery Address */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xs">
                  1
                </div>
                <h2 className="text-base font-bold text-slate-900">Select Delivery Address</h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    setIsAuthModalOpen(true);
                    return;
                  }
                  setIsAddressModalOpen(true);
                }}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add New
              </button>
            </div>

            {!isAuthenticated ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-3">
                <p className="font-semibold">Sign in required to proceed with checkout</p>
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="inline-block px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  Sign In Now
                </button>
              </div>
            ) : addresses.length === 0 && !loadingAddresses ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <p className="text-xs text-slate-600">You don't have any saved addresses yet.</p>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(true)}
                  className="inline-block px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-700 cursor-pointer"
                >
                  + Add Delivery Address
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr, idx) => {
                  const isSelected = selectedAddressId === addr.id;

                  return (
                    <div
                      key={addr.id || `address-${idx}`}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/40 shadow-xs ring-2 ring-emerald-500/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        {addr.type === "WORK" ? (
                          <Briefcase className="w-4 h-4 text-slate-500" />
                        ) : (
                          <Home className="w-4 h-4 text-slate-500" />
                        )}
                        <span className="text-xs font-black uppercase text-slate-800">
                          {addr.type}
                        </span>
                        {(addr.isDefault || addr.is_default) && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm font-semibold">
                            Default
                          </span>
                        )}
                      </div>

                      {(addr.name || addr.phone) && (
                        <p className="text-[11px] font-bold text-slate-800 mb-1 flex items-center gap-2">
                          <span>{addr.name || "Customer"}</span>
                          {addr.phone && (
                            <span className="text-emerald-700 flex items-center gap-0.5">
                              <Phone className="w-2.5 h-2.5" /> +91 {addr.phone}
                            </span>
                          )}
                        </p>
                      )}

                      <p className="text-xs text-slate-700 line-clamp-2">
                        {addr.flat || addr.house_flat ? `${addr.flat || addr.house_flat}, ` : ""}
                        {addr.addressLine1 || addr.address_line}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {addr.city} • {addr.pincode}
                      </p>

                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-3 right-3" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ordering for someone else toggle & inputs */}
            <div className="pt-2">
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isOrderingForOther}
                    onChange={(e) => setIsOrderingForOther(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Gift className="w-4 h-4 text-indigo-600" />
                    Ordering for someone else? (Gift, friend, or family)
                  </span>
                </label>

                {isOrderingForOther && (
                  <div className="space-y-2.5 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Recipient's Name (Person Taking Parcel) *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Full Name (e.g. Ayesha Khan)"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 outline-hidden focus:border-indigo-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Recipient's Mobile Number *
                        </label>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-slate-400 font-semibold select-none">+91</span>
                          <input
                            type="tel"
                            required
                            placeholder="98765 43210"
                            value={recipientPhone}
                            onChange={(e) =>
                              setRecipientPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                            }
                            className="w-full pl-11 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 outline-hidden focus:border-indigo-500 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-indigo-800 font-medium bg-white/70 p-2.5 rounded-xl border border-indigo-100">
                      ℹ️ Our delivery partner will call this mobile number on arrival and verify the handover OTP with this recipient.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Instructions */}
            <div className="pt-1">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Delivery Instructions (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Leave with security guard, don't ring bell"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-hidden focus:bg-white focus:border-indigo-500 font-medium"
              />
            </div>
          </div>

          {/* Step 2: Payment Method */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                2
              </div>
              <h2 className="text-base font-bold text-slate-900">Choose Payment Method</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cash On Delivery */}
              <div
                onClick={() => setPaymentMethod("COD")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  paymentMethod === "COD"
                    ? "border-emerald-500 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">Cash on Delivery</span>
                    <span className="text-[11px] text-slate-500">Pay cash or UPI at your door</span>
                  </div>
                </div>
                {paymentMethod === "COD" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              </div>

              {/* Online Payment (Razorpay / UPI / Cards) */}
              <div
                onClick={() => setPaymentMethod("ONLINE")}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  paymentMethod === "ONLINE"
                    ? "border-indigo-500 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 block">Online Payment</span>
                    <span className="text-[11px] text-slate-500">UPI, Cards, Netbanking</span>
                  </div>
                </div>
                {paymentMethod === "ONLINE" && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs text-slate-400">{items.length} items</span>
            </h3>

            {/* Shop info */}
            {shop && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 truncate">
                  <Store className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div className="text-xs truncate">
                    <span className="font-bold text-slate-800 block truncate">{shop.name}</span>
                    <span className="text-slate-400">⚡ 10-15 mins delivery</span>
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shrink-0 ${
                    isShopOpen(shop)
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {isShopOpen(shop) ? "Open" : "Closed"}
                </span>
              </div>
            )}

            {/* Closed Store Warning */}
            {shop && !isShopOpen(shop) && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" /> Store is currently closed
                </p>
                <p className="text-[11px] text-rose-700">
                  {shop.name} is not accepting orders right now. Please explore items from open partner stores.
                </p>
              </div>
            )}

            {/* Item Previews */}
            <div className="max-h-48 overflow-y-auto space-y-2 py-1 pr-1 text-xs">
              {items.map((i, idx) => {
                const itemKey =
                  i.id || i.product_id || i.productId || i.product?.id || `cart-item-${idx}`;
                const prod = i.product || i;
                const effectivePrice =
                  prod.discount_price != null
                    ? Number(prod.discount_price)
                    : prod.discountPrice != null
                    ? Number(prod.discountPrice)
                    : Number(prod.price || 0);

                return (
                  <div key={itemKey} className="flex justify-between items-center text-slate-700">
                    <span className="truncate max-w-[170px]">
                      {i.quantity}x {prod.name}
                    </span>
                    <span className="font-semibold shrink-0">
                      ₹{effectivePrice * i.quantity}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bill Details */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{cartSubtotal}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount</span>
                  <span>- ₹{couponDiscount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxes & GST (5%)</span>
                <span>₹{taxAmount}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-base font-black text-slate-900">Total to Pay</span>
                <span className="text-2xl font-black text-slate-900">₹{cartTotal}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={submitting || (shop && !isShopOpen(shop))}
              onClick={handlePlaceOrder}
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? (
                <span>Placing your order...</span>
              ) : shop && !isShopOpen(shop) ? (
                <span>Store Currently Closed</span>
              ) : (
                <>
                  <span>Place Order • ₹{cartTotal}</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Inline Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900">Add Delivery Address</h3>
                <p className="text-[11px] text-slate-500">Provide accurate address and phone for 10-15m delivery</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={detectingGps}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  <Crosshair className={`w-3.5 h-3.5 ${detectingGps ? "animate-spin" : ""}`} />
                  {detectingGps ? "Detecting GPS..." : "Use Current Location"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-3.5">
              {/* Contact Person & Mobile Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Contact / Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium outline-hidden focus:bg-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mobile Number *
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-slate-400 font-semibold select-none text-xs">+91</span>
                    <input
                      type="tel"
                      required
                      placeholder="98765 43210"
                      value={newAddress.phone}
                      onChange={(e) =>
                        setNewAddress({ ...newAddress, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                      }
                      className="w-full pl-11 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium outline-hidden focus:bg-white focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Flat / House / Building No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flat 402, Cyber Heights"
                  value={newAddress.house_flat}
                  onChange={(e) => setNewAddress({ ...newAddress, house_flat: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium outline-hidden focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Street / Area / Colony *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Road No. 36, Jubilee Hills"
                  value={newAddress.address_line}
                  onChange={(e) => setNewAddress({ ...newAddress, address_line: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium outline-hidden focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Near Metro Station / Pillar 12"
                  value={newAddress.landmark}
                  onChange={(e) => setNewAddress({ ...newAddress, landmark: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium outline-hidden focus:bg-white focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    value={newAddress.city}
                    onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium outline-hidden focus:bg-white focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    value={newAddress.pincode}
                    onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium outline-hidden focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1.5">Address Type</label>
                <div className="flex gap-2">
                  {["HOME", "WORK", "OTHER"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewAddress({ ...newAddress, type: t })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        newAddress.type === t
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:bg-slate-300 cursor-pointer"
                >
                  {savingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auth Modal for Unauthenticated Users */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    </ProtectedRoute>
  );
}
