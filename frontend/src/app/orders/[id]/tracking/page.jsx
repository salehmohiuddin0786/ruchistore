"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Bike,
  Store,
  MapPin,
  Phone,
  ShieldCheck,
  AlertCircle,
  Navigation,
  Sparkles,
} from "lucide-react";
import apiClient from "../../../../api/apiClient";
import socket from "../../../../lib/socket";
import { useToast } from "../../../../context/ToastContext";

const TRACKING_STEPS = [
  { key: "PLACED", label: "Order Placed", desc: "We've received your order" },
  { key: "CONFIRMED", label: "Order Confirmed", desc: "Store accepted your order" },
  { key: "PACKING", label: "Packing Items", desc: "Fresh groceries being packed" },
  { key: "READY_FOR_PICKUP", label: "Ready for Pickup", desc: "Bag sealed and ready" },
  { key: "ASSIGNED", label: "Delivery Partner Assigned", desc: "Rider on the way to store" },
  { key: "PICKED_UP", label: "Order Picked Up", desc: "Rider has collected your order" },
  { key: "OUT_FOR_DELIVERY", label: "Out for Delivery", desc: "Speeding to your doorstep" },
  { key: "DELIVERED", label: "Delivered", desc: "Handed over at your door" },
];

export default function OrderTrackingPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.id;
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [partnerLocation, setPartnerLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();

      // Connect to WebSocket room for real-time tracking
      socket.connect();
      socket.emit("order:join", { orderId: Number(orderId) });

      const handleStatusUpdate = (data) => {
        if (data.orderId === Number(orderId) || data.id === Number(orderId)) {
          showToast(`Order status updated to: ${data.orderStatus || data.status}`, "info");
          setOrder((prev) => ({
            ...prev,
            orderStatus: data.orderStatus || data.status,
            deliveryPartner: data.deliveryPartner || prev?.deliveryPartner,
          }));
        }
      };

      const handleLocationUpdate = (loc) => {
        if (loc.orderId === Number(orderId)) {
          setPartnerLocation({
            latitude: loc.latitude,
            longitude: loc.longitude,
            updatedAt: new Date(),
          });
        }
      };

      socket.on("order:status_updated", handleStatusUpdate);
      socket.on("delivery:location_updated", handleLocationUpdate);

      return () => {
        socket.emit("order:leave", { orderId: Number(orderId) });
        socket.off("order:status_updated", handleStatusUpdate);
        socket.off("delivery:location_updated", handleLocationUpdate);
      };
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/orders/${orderId}`);
      if (res.data?.success) {
        setOrder(res.data.data?.order || res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="h-10 w-48 bg-slate-200/60 rounded-xl mx-auto animate-pulse" />
        <div className="h-96 bg-slate-200/60 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <Link href="/orders" className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs">
          View All Orders
        </Link>
      </div>
    );
  }

  // Calculate current step index
  const currentStatus = order?.orderStatus || order?.order_status || "PLACED";
  const currentStatusIndex = Math.max(0, TRACKING_STEPS.findIndex((s) => s.key === currentStatus));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Live Order Tracking
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </h1>
            <p className="text-xs text-slate-500">
              Order #{order.orderNumber || order.order_number || order.id} • Real-time Socket.IO updates
            </p>
          </div>
        </div>

        <Link
          href={`/orders/${order.id}`}
          className="text-xs font-bold text-indigo-600 hover:underline"
        >
          View Bill
        </Link>
      </div>

      {/* ETA Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-200">
            Estimated Delivery Time
          </span>
          <h2 className="text-2xl sm:text-3xl font-black">
            {order.orderStatus === "DELIVERED" ? "Delivered!" : "10 - 15 Minutes"}
          </h2>
          <p className="text-xs text-emerald-100">
            {order.orderStatus === "DELIVERED"
              ? "Your groceries have been handed over. Enjoy!"
              : "Our fast delivery fleet is fulfilling your daily essentials."}
          </p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
          <Bike className="w-8 h-8 text-amber-300 animate-bounce" />
        </div>
      </div>

      {/* Delivery Partner Details (if assigned) */}
      {order.deliveryPartner && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-black">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Delivery Partner
              </span>
              <h3 className="text-sm font-black text-slate-900 mt-0.5">
                {order.deliveryPartner.user?.name || "Ramesh Kumar"}
              </h3>
              <p className="text-xs text-slate-500">
                {order.deliveryPartner.vehicleNumber || "Two Wheeler"} • ⭐ 4.9
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {order.deliveryPartner.user?.phone && (
              <a
                href={`tel:${order.deliveryPartner.user.phone}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Call Rider
              </a>
            )}
          </div>
        </div>
      )}

      {/* GPS Coordinate Display (if live location received) */}
      {partnerLocation && (
        <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>
              Live GPS: {partnerLocation.latitude?.toFixed(4)}, {partnerLocation.longitude?.toFixed(4)}
            </span>
          </div>
          <span className="text-slate-400 text-[10px]">Active Stream</span>
        </div>
      )}

      {/* Real-time Order Steps Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Order Status History
        </h3>

        <div className="relative pl-6 sm:pl-8 space-y-8">
          {/* Vertical Connecting Line */}
          <div className="absolute left-2.5 sm:left-3.5 top-3 bottom-3 w-0.5 bg-slate-200" />

          {TRACKING_STEPS.map((step, idx) => {
            const isCompleted = currentStatusIndex >= idx;
            const isCurrent = currentStatusIndex === idx;

            return (
              <div key={step.key} className="relative flex items-start gap-4">
                {/* Node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white transition-all z-10 ${
                    isCurrent
                      ? "bg-emerald-600 ring-4 ring-emerald-100 scale-110"
                      : isCompleted
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div>
                  <h4
                    className={`text-sm font-bold ${
                      isCurrent
                        ? "text-emerald-700 font-black"
                        : isCompleted
                        ? "text-slate-800"
                        : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
