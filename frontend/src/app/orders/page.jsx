"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  Package,
  Store,
  ArrowRight,
  Bike,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import apiClient from "../../api/apiClient";
import { useAuth } from "../../context/AuthContext";

const STATUS_COLOR_MAP = {
  PLACED: "bg-blue-50 text-blue-700 border-blue-200",
  CONFIRMED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  PACKING: "bg-purple-50 text-purple-700 border-purple-200",
  READY_FOR_PICKUP: "bg-amber-50 text-amber-700 border-amber-200",
  ASSIGNED: "bg-yellow-50 text-yellow-800 border-yellow-200",
  PICKED_UP: "bg-teal-50 text-teal-700 border-teal-200",
  OUT_FOR_DELIVERY: "bg-emerald-50 text-emerald-800 border-emerald-300 font-extrabold animate-pulse",
  DELIVERED: "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-200",
  REFUNDED: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/orders");
      if (res.data?.success) {
        setOrders(res.data.data?.orders || res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <Package className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Sign in to view your orders</h2>
        <p className="text-xs text-slate-500">Track current deliveries and browse your grocery order history.</p>
        <Link href="/" className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          My Grocery Orders
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track live deliveries and view past invoices
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-3xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No orders placed yet</h3>
          <p className="text-xs text-slate-400">Order fresh groceries delivered to your door in 10-15 minutes!</p>
          <Link
            href="/"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const currentStatus = order.orderStatus || order.order_status || "PLACED";
            const isLive = !["DELIVERED", "CANCELLED", "REFUNDED"].includes(currentStatus);
            const total = order.totalAmount || order.total_amount || 0;
            const orderNum = order.orderNumber || order.order_number || order.id;
            const orderDate = order.createdAt || order.created_at || new Date();

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {order.shop?.name || "Local Partner Store"}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Order #{orderNum} • {new Date(orderDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs px-3 py-1 rounded-full border ${
                        STATUS_COLOR_MAP[currentStatus] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {String(currentStatus).replace(/_/g, " ")}
                    </span>
                    <span className="text-base font-black text-slate-900">
                      ₹{total}
                    </span>
                  </div>
                </div>

                {/* Items preview */}
                <div className="text-xs text-slate-600 flex flex-wrap gap-2">
                  {order.items?.map((item, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium"
                    >
                      {item.quantity}x {item.name || item.product?.name || "Product"}
                    </span>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {isLive && (
                    <Link
                      href={`/orders/${order.id}/tracking`}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Bike className="w-3.5 h-3.5" />
                      Track Live Delivery
                    </Link>
                  )}
                  <Link
                    href={`/orders/${order.id}`}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1"
                  >
                    View Details <ChevronRight className="w-3.5 h-3.5" />
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
