"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
  MapPin,
  Phone,
  Bike,
  CheckCircle2,
  Clock,
  Package,
  ShieldCheck,
  Navigation,
  CheckSquare,
  Square,
  IndianRupee,
} from "lucide-react";
import apiClient from "../../../../api/apiClient";
import socket from "../../../../lib/socket";
import { useToast } from "../../../../context/ToastContext";

export default function DeliveryOrderDetailPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.id;
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [checkedItems, setCheckedItems] = useState({});

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/delivery/orders/${orderId}`);
      if (res.data?.success) {
        setOrder(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to load order details", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleItemCheck = (itemId) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdating(true);
      const res = await apiClient.put(`/delivery/orders/${orderId}/status`, {
        status: newStatus,
      });
      if (res.data?.success) {
        showToast(`Order status updated to ${String(newStatus || "").replace(/_/g, " ")}!`, "success");
        loadOrder();
        if (newStatus === "DELIVERED") {
          setTimeout(() => {
            router.push("/delivery/orders?tab=completed");
          }, 1200);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleSendLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        socket.emit("delivery:update_location", {
          orderId: Number(orderId),
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        showToast("Live GPS coordinates broadcast to customer!", "info");
      });
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-16 space-y-4">
        <div className="h-10 w-48 bg-slate-200/60 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-200/60 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <Link href="/delivery/orders" className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs">
          Back to Orders
        </Link>
      </div>
    );
  }

  const currentStatus = order.orderStatus || order.order_status || "ASSIGNED";
  const dropAddress = order.address || order.deliveryAddress;
  const isSomeoneElse = Boolean(order.recipientName || order.recipient_name);
  const recipientName = order.recipientName || order.recipient_name || dropAddress?.name || order.user?.name || order.customer?.name || "Customer";
  const recipientPhone = order.recipientPhone || order.recipient_phone || dropAddress?.phone || order.user?.phone || order.customer?.phone;
  const buyerName = order.user?.name || order.customer?.name || "Customer";
  const customerFee = Number(order.customerDeliveryFee !== undefined ? order.customerDeliveryFee : (order.deliveryFee || 0));
  const riderPayout = Number(order.riderPayout !== undefined ? order.riderPayout : (customerFee > 0 ? customerFee : 25));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/delivery/orders")}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Fulfill Order #{order.orderNumber || order.id}
            </h1>
            <p className="text-xs text-slate-500">
              Current Status:{" "}
              <span className="font-bold text-emerald-600">
                {String(currentStatus).replace(/_/g, " ")}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={handleSendLocation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5" /> Send GPS
        </button>
      </div>

      {/* Step 1: Pickup from Store */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Step 1: Store Pickup
              </span>
              <h3 className="text-sm font-black text-slate-900">{order.shop?.name || "Partner Store"}</h3>
              <p className="text-xs text-slate-500">{order.shop?.address}</p>
            </div>
          </div>
          {order.shop?.phone && (
            <a
              href={`tel:${order.shop.phone}`}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              title="Call Store"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Item checklist with tap to verify */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Verify & Collect Items ({order.items?.length || 0}):
            </h4>
            <span className="text-[11px] text-slate-400">Tap item to check off</span>
          </div>

          <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            {order.items?.map((item) => {
              const isChecked = Boolean(checkedItems[item.id]);

              return (
                <div
                  key={item.id}
                  onClick={() => toggleItemCheck(item.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isChecked
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
                      : "bg-white border-slate-200/80 text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                    <span className={`text-xs ${isChecked ? "line-through opacity-70" : "font-medium"}`}>
                      <strong className="font-bold text-indigo-600">{item.quantity}x</strong>{" "}
                      {item.name || item.product?.name || "Grocery Item"}{" "}
                      <span className="text-[11px] text-slate-400">({item.unit || "pack"})</span>
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    ₹{item.totalPrice !== undefined ? item.totalPrice : (item.total_price || item.price * item.quantity)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step 2: Dropoff to Customer */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Step 2: Customer Delivery
                </span>
                {isSomeoneElse && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    🎁 Ordered for Someone Else
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-slate-900 mt-0.5">
                {recipientName} {isSomeoneElse ? "(Taking Parcel)" : ""}
              </h3>
              {isSomeoneElse && (
                <p className="text-[11px] text-slate-500 font-medium">
                  Ordered by: {buyerName}
                </p>
              )}
              <p className="text-xs text-slate-600 font-medium">
                {dropAddress ? `${dropAddress.flat ? dropAddress.flat + ", " : ""}${dropAddress.addressLine1 || ""}, ${dropAddress.city || ""}` : "Delivery Address"}
              </p>
            </div>
          </div>
          {recipientPhone && (
            <a
              href={`tel:${recipientPhone}`}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
            >
              <Phone className="w-3.5 h-3.5" /> Call {isSomeoneElse ? "Recipient" : "Customer"}
            </a>
          )}
        </div>

        {order.deliveryInstructions && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900">
            <strong>Customer Note:</strong> {order.deliveryInstructions}
          </div>
        )}

        {/* Clear Financial Comparison: Bill Fee vs Rider Payout */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-600">
            <span>Customer Bill Order Total:</span>
            <span className="font-bold text-slate-900">₹{order.totalAmount || 0}</span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>Customer Bill Delivery Fee:</span>
            <span className="font-bold text-slate-800">
              {customerFee > 0 ? `₹${customerFee}.00` : "FREE (Promotional)"}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600">
            <span>Payment Mode:</span>
            <span className="font-bold uppercase font-mono text-slate-900">
              {order.paymentMethod || "COD"} ({order.paymentStatus || "PENDING"})
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">Collect from Customer:</span>
            <span className="text-sm font-black text-slate-950">
              {order.paymentMethod === "COD" ? `₹${order.totalAmount} (CASH ON DELIVERY)` : "₹0 (ALREADY PAID)"}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
            <span className="font-bold text-emerald-700">Rider Trip Payout:</span>
            <span className="text-base font-black text-emerald-600">₹{riderPayout}.00</span>
          </div>
        </div>
      </div>

      {/* Action Status Transition Buttons */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Delivery Actions</h3>

        {currentStatus === "ASSIGNED" && (
          <button
            onClick={() => handleUpdateStatus("PICKED_UP")}
            disabled={updating}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            {updating ? "Updating..." : "1. Confirm Pickup from Store"}
          </button>
        )}

        {currentStatus === "PICKED_UP" && (
          <button
            onClick={() => handleUpdateStatus("OUT_FOR_DELIVERY")}
            disabled={updating}
            className="w-full py-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-black text-sm shadow-md shadow-amber-600/20 transition-all cursor-pointer"
          >
            {updating ? "Updating..." : "2. Start Ride (Out for Delivery)"}
          </button>
        )}

        {currentStatus === "OUT_FOR_DELIVERY" && (
          <button
            onClick={() => handleUpdateStatus("DELIVERED")}
            disabled={updating}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            {updating ? "Processing Delivery..." : "3. Confirm Handover & Complete Delivery"}
          </button>
        )}

        {currentStatus === "DELIVERED" && (
          <div className="p-5 rounded-2xl bg-emerald-50 text-emerald-900 text-center font-bold text-xs space-y-2 border border-emerald-200">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-base font-black">Delivery Completed Successfully!</p>
            <p className="text-slate-600 font-normal">
              ₹{riderPayout}.00 has been credited to your delivery earnings wallet.
            </p>
            <div className="pt-2">
              <Link
                href="/delivery/orders?tab=completed"
                className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                Back to Completed Deliveries
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
