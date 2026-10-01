"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  ArrowRight,
  AlertTriangle,
  Bike,
} from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";

export default function ShopOwnerDashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    todayRevenue: 0,
    todayOrders: 0,
    pendingToPack: 0,
    lowStockCount: 0,
  });

  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  /* =========================================================
     LOAD DASHBOARD DATA
  ========================================================= */

  const loadDashboard = async () => {
    try {
      setLoading(true);

      const [statsRes, ordersRes] = await Promise.allSettled([
        apiClient.get("/shop-owner/stats"),
        apiClient.get("/shop-owner/orders?limit=5"),
      ]);

      /* =====================================================
         STATS
      ===================================================== */

      if (
        statsRes.status === "fulfilled" &&
        statsRes.value?.data?.success
      ) {
        const statsData = statsRes.value?.data?.data?.stats || statsRes.value?.data?.data;

        setStats({
          todayRevenue: Number(statsData?.todayRevenue ?? statsData?.todaySales ?? 0),
          todayOrders: Number(statsData?.todayOrders ?? statsData?.todayOrdersCount ?? 0),
          pendingToPack: Number(statsData?.pendingToPack ?? statsData?.pendingOrdersCount ?? 0),
          lowStockCount: Number(statsData?.lowStockCount ?? 0),
        });
      }

      /* =====================================================
         RECENT ORDERS
      ===================================================== */

      if (
        ordersRes.status === "fulfilled" &&
        ordersRes.value?.data?.success
      ) {
        const orders =
          ordersRes.value?.data?.data?.orders || ordersRes.value?.data?.data;

        const orderList = Array.isArray(orders) ? orders : [];
        const sorted = [...orderList].sort(
          (a, b) => new Date(b.createdAt || b.created_at) - new Date(a.createdAt || a.created_at)
        );

        setRecentOrders(sorted);
      }
    } catch (error) {
      console.error(
        "❌ Dashboard loading error:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     FORMAT ORDER STATUS
  ========================================================= */

  const formatOrderStatus = (order) => {
    const status =
      order?.orderStatus ||
      order?.order_status ||
      order?.status ||
      "UNKNOWN";

    return String(status)
      .replace(/_/g, " ")
      .toUpperCase();
  };

  /* =========================================================
     FORMAT AMOUNT
  ========================================================= */

  const formatAmount = (amount) => {
    const value = Number(amount);

    if (Number.isNaN(value)) {
      return "0";
    }

    return value.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
    });
  };

  /* =========================================================
     LOADING STATE
  ========================================================= */

  if (loading) {
    return (
      <div className="space-y-6">

        {/* Welcome Skeleton */}
        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-md animate-pulse">
          <div className="h-3 w-40 bg-slate-700 rounded mb-3" />
          <div className="h-7 w-56 bg-slate-700 rounded mb-2" />
          <div className="h-3 w-full max-w-xl bg-slate-700 rounded" />
        </div>

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs animate-pulse"
            >
              <div className="h-3 w-28 bg-slate-200 rounded mb-4" />
              <div className="h-7 w-20 bg-slate-200 rounded mb-3" />
              <div className="h-3 w-24 bg-slate-200 rounded" />
            </div>
          ))}
        </div>

        {/* Orders Skeleton */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
          <div className="h-5 w-48 bg-slate-200 rounded mb-6" />

          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-24 bg-slate-100 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <div className="space-y-6">

      {/* =====================================================
          WELCOME BANNER
      ===================================================== */}

      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Store Management Console
          </span>

          <h1 className="text-2xl font-black tracking-tight mt-0.5">
            Store Dashboard
          </h1>

          <p className="text-xs text-slate-400 mt-1">
            Accept incoming orders, pack fresh essentials,
            and manage your supermarket inventory in real
            time.
          </p>
        </div>

        <Link
          href="/shop-owner/orders"
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5 self-start sm:self-center"
        >
          <ShoppingBag className="w-4 h-4" />
          Manage Orders
        </Link>
      </div>

      {/* =====================================================
          METRICS GRID
      ===================================================== */}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

        {/* Today's Sales */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">

          <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
            Today's Sales
          </span>

          <p className="text-2xl font-black text-slate-900">
            ₹{formatAmount(stats?.todayRevenue)}
          </p>

          <span className="text-[11px] text-emerald-600 font-semibold">
            Net store revenue
          </span>
        </div>

        {/* Today's Orders */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">

          <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
            Today's Orders
          </span>

          <p className="text-2xl font-black text-slate-900">
            {stats?.todayOrders || 0}
          </p>

          <span className="text-[11px] text-slate-400">
            Customer requests
          </span>
        </div>

        {/* Needs Packing */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">

          <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Needs Packing
          </span>

          <p className="text-2xl font-black text-amber-600">
            {stats?.pendingToPack || 0}
          </p>

          <span className="text-[11px] text-amber-600 font-semibold">
            Awaiting store pack
          </span>
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">

          <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            Low Stock Alerts
          </span>

          <p className="text-2xl font-black text-red-600">
            {stats?.lowStockCount || 0}
          </p>

          <span className="text-[11px] text-slate-400">
            Needs restock
          </span>
        </div>
      </div>

      {/* =====================================================
          RECENT ORDERS
      ===================================================== */}

      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">

          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-purple-600" />
            Recent Store Orders
          </h2>

          <Link
            href="/shop-owner/orders"
            className="text-xs font-bold text-purple-600 hover:underline"
          >
            View All Orders
          </Link>
        </div>

        {/* No Orders */}
        {recentOrders.length === 0 ? (
          <div className="text-center py-12 space-y-2">

            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />

            <p className="text-sm font-bold text-slate-700">
              No new orders waiting
            </p>

            <p className="text-xs text-slate-400">
              When a customer places an order from your
              store, it will immediately ring here!
            </p>
          </div>
        ) : (
          /* =================================================
             ORDER LIST
          ================================================= */

          <div className="space-y-3">

            {recentOrders.map((order, index) => {

              /* ---------------------------------------------
                 Safe order values
              --------------------------------------------- */

              const orderId =
                order?.id ||
                order?.orderId ||
                `order-${index}`;

              const orderNumber =
                order?.orderNumber ||
                order?.id ||
                "N/A";

              const status =
                formatOrderStatus(order);

              const itemCount = Array.isArray(
                order?.items
              )
                ? order.items.length
                : 0;

              const totalAmount =
                formatAmount(
                  order?.totalAmount
                );

              const customerName =
                order?.user?.name ||
                order?.customer?.name ||
                "Customer";

              const city =
                order?.address?.city ||
                order?.deliveryAddress?.city ||
                "";

              const rawStatus = (
                order?.orderStatus ||
                order?.order_status ||
                order?.status ||
                ""
              ).toUpperCase();

              return (
                <div
                  key={orderId}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Order Information */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-900">
                        Order #{orderNumber}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          rawStatus === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : rawStatus === "CANCELLED"
                            ? "bg-rose-100 text-rose-800"
                            : ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(rawStatus)
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      {itemCount} grocery{" "}
                      {itemCount === 1
                        ? "item"
                        : "items"}{" "}
                      • Total: ₹{totalAmount}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      Customer: {customerName}
                      {city ? ` (${city})` : ""}
                    </p>

                    {order.deliveryPartner ? (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-1 border border-indigo-100">
                        <Bike className="w-3 h-3" />
                        Rider: {order.deliveryPartner.user?.name || "Assigned"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-flex items-center gap-1 mt-1 border border-amber-200">
                        <Bike className="w-3 h-3" />
                        No Rider Assigned
                      </span>
                    )}
                  </div>

                  {/* Contextual Action Button */}
                  {["PLACED", "CONFIRMED", "PACKING"].includes(rawStatus) ? (
                    <Link
                      href="/shop-owner/orders"
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors self-start sm:self-center shadow-xs"
                    >
                      Pack Order
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : ["READY_FOR_PICKUP", "ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(rawStatus) ? (
                    <Link
                      href="/shop-owner/orders"
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors self-start sm:self-center shadow-xs"
                    >
                      Track Order
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : rawStatus === "DELIVERED" ? (
                    <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs flex items-center gap-1.5 self-start sm:self-center">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Delivered ✓
                    </div>
                  ) : (
                    <Link
                      href="/shop-owner/orders"
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors self-start sm:self-center"
                    >
                      View Details
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}