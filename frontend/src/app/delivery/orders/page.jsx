"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Store, MapPin, Bike, ArrowRight, CheckCircle2, User, Clock } from "lucide-react";
import apiClient from "../../../api/apiClient";

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get("tab");
      if (urlTab && ["all", "active", "completed"].includes(urlTab)) {
        setTab(urlTab);
      }
    }
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/delivery/orders");
      if (res.data?.success) {
        setOrders(res.data.data?.orders || []);
      }
    } catch (err) {
      console.error("Failed to load delivery orders", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter((o) => {
    const status = o.orderStatus || o.order_status;
    if (tab === "active") {
      return ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(status);
    }
    if (tab === "completed") {
      return status === "DELIVERED";
    }
    return true;
  });

  const activeCount = orders.filter((o) =>
    ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(o.orderStatus || o.order_status)
  ).length;

  const completedCount = orders.filter((o) =>
    (o.orderStatus || o.order_status) === "DELIVERED"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Delivery Tasks</h1>
          <p className="text-xs text-slate-500">View current active orders, item checklists, and completed trips</p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
          <button
            onClick={() => setTab("active")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === "active"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Active</span>
            {activeCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                tab === "active" ? "bg-white text-emerald-700" : "bg-emerald-100 text-emerald-800"
              }`}>
                {activeCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab("completed")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === "completed"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>Completed</span>
            {completedCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                tab === "completed" ? "bg-slate-700 text-white" : "bg-slate-200 text-slate-700"
              }`}>
                {completedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
              tab === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({orders.length})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 rounded-3xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No {tab} deliveries</h3>
          <p className="text-xs text-slate-400">
            {tab === "active"
              ? "You do not have any active pickups in progress right now. Switch to 'Completed' to see previous trips."
              : "No trip history found under this tab."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const currentStatus = order.orderStatus || order.order_status || "ASSIGNED";
            const isCompleted = currentStatus === "DELIVERED";
            const dropAddress = order.address || order.deliveryAddress;
            const customerName = order.user?.name || order.customer?.name || "Customer";
            const customerFee = Number(order.customerDeliveryFee !== undefined ? order.customerDeliveryFee : (order.deliveryFee || 0));
            const riderPayout = Number(order.riderPayout !== undefined ? order.riderPayout : (customerFee > 0 ? customerFee : 25));

            return (
              <div
                key={order.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border shadow-xs space-y-4 transition-all ${
                  isCompleted ? "border-slate-200" : "border-emerald-300/80 ring-2 ring-emerald-500/10"
                }`}
              >
                {/* Header: Order ID + Status */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-black text-slate-900">
                      Order #{order.orderNumber || order.id}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                        isCompleted
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-indigo-100 text-indigo-800 border border-indigo-200 animate-pulse"
                      }`}
                    >
                      {String(currentStatus).replace(/_/g, " ")}
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent"}
                  </span>
                </div>

                {/* Pickup and Drop Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Store className="w-3 h-3 text-indigo-600" /> Store Pickup
                    </span>
                    <p className="font-bold text-slate-900">{order.shop?.name || "Partner Supermarket"}</p>
                    <p className="text-slate-500 text-[11px] truncate">{order.shop?.address || "Store address"}</p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-600" /> Customer Drop
                    </span>
                    <p className="font-bold text-slate-900">{customerName}</p>
                    <p className="text-slate-500 text-[11px] truncate">
                      {dropAddress ? `${dropAddress.flat ? dropAddress.flat + ", " : ""}${dropAddress.addressLine1 || ""}, ${dropAddress.city || ""}` : "Delivery Address"}
                    </p>
                  </div>
                </div>

                {/* Order Items List */}
                <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5 text-slate-900">
                      <Package className="w-3.5 h-3.5 text-indigo-600" />
                      Items in Order ({order.items?.length || 0})
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Total qty: {order.items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 0}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <span
                          key={item.id || idx}
                          className="inline-flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-xl text-xs font-medium text-slate-800 shadow-2xs"
                        >
                          <span className="font-black text-indigo-600">{item.quantity}x</span>
                          <span className="truncate max-w-[160px] font-semibold">{item.name || item.product?.name || "Grocery Item"}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No item details available</span>
                    )}
                  </div>
                </div>

                {/* Financial Summary & Action Footer */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Bill Delivery Fee</span>
                      <span className="font-bold text-slate-800">
                        {customerFee > 0 ? `₹${customerFee}.00` : "FREE (Promo)"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Collect from Customer</span>
                      <span className="font-bold text-slate-900">
                        {order.paymentMethod === "COD" ? `₹${order.totalAmount || 0} (COD)` : "₹0 (PREPAID)"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-emerald-600 uppercase font-bold block">Rider Trip Payout</span>
                      <span className="text-sm font-black text-emerald-600">₹{riderPayout}.00</span>
                    </div>
                  </div>

                  <Link
                    href={`/delivery/order/${order.id}`}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
                      isCompleted
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                    }`}
                  >
                    {isCompleted ? "View Details" : "Fulfill Trip"} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
