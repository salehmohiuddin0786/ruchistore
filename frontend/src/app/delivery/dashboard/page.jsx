"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bike,
  IndianRupee,
  Package,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Store,
  ShieldCheck,
} from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useAuth } from "../../../context/AuthContext";

export default function DeliveryDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    todayEarnings: 0,
    todayDeliveries: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
  });
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardRes, ordersRes] = await Promise.allSettled([
        apiClient.get("/delivery/dashboard"),
        apiClient.get("/delivery/orders"),
      ]);

      let allOrders = [];
      if (ordersRes.status === "fulfilled" && ordersRes.value.data?.success) {
        allOrders = ordersRes.value.data.data?.orders || [];
      }

      const activeList = allOrders.filter((o) =>
        ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(o.orderStatus || o.order_status)
      );
      const completedList = allOrders.filter(
        (o) => (o.orderStatus || o.order_status) === "DELIVERED"
      );

      const computedEarnings = completedList.reduce(
        (sum, o) => sum + Number(o.riderPayout || o.customerDeliveryFee || o.deliveryFee || 25),
        0
      );

      let statsObj = {
        todayEarnings: 0,
        todayDeliveries: 0,
        pendingOrders: activeList.length,
        completedOrders: completedList.length,
        totalEarnings: computedEarnings,
      };

      if (dashboardRes.status === "fulfilled" && dashboardRes.value.data?.success) {
        const d = dashboardRes.value.data.data || {};
        const s = d.stats || d.summary || {};
        const totalDelivered = s.completedOrders || s.totalDeliveries || completedList.length;

        statsObj = {
          todayEarnings: Number(s.todayEarnings !== undefined ? s.todayEarnings : 0),
          todayDeliveries: Number(s.todayDeliveries !== undefined ? s.todayDeliveries : 0),
          pendingOrders: Number(s.pendingOrders !== undefined ? s.pendingOrders : activeList.length),
          completedOrders: totalDelivered,
          totalEarnings: Number(s.totalEarnings || computedEarnings),
        };
      }

      setStats(statsObj);
      setActiveOrders(activeList);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Delivery Partner Fleet
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-0.5">
            Welcome back, {user?.name || "Rider"}!
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deliver hyperfast daily grocery orders and earn per delivery with instant payouts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            ⚡ Quick-Commerce SLA: 10-15 Min
          </span>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Today's Earnings
          </span>
          <p className="text-2xl font-black text-slate-900">₹{stats.todayEarnings || 0}.00</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Available for payout</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-indigo-600" /> Deliveries Today
          </span>
          <p className="text-2xl font-black text-slate-900">{stats.todayDeliveries || 0}</p>
          <span className="text-[11px] text-slate-400">Completed trips today</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> Active Tasks
          </span>
          <p className="text-2xl font-black text-slate-900">{activeOrders.length}</p>
          <span className="text-[11px] text-amber-600 font-semibold">Trips in progress</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> Total Completed
          </span>
          <p className="text-2xl font-black text-slate-900">{stats.completedOrders || 0}</p>
          <span className="text-[11px] text-slate-400">Lifetime delivered orders</span>
        </div>
      </div>

      {/* Active Deliveries Queue */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
            <Bike className="w-4 h-4 text-emerald-600" /> Active Deliveries In Progress
          </h2>
          <Link href="/delivery/orders" className="text-xs font-bold text-indigo-600 hover:underline">
            View All ({activeOrders.length})
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Bike className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No active delivery in progress</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Stay <strong>ONLINE</strong>. When an order is placed near your location, a 30-second delivery offer popup will appear!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeOrders.map((order) => {
              const currentStatus = order.orderStatus || order.order_status || "ASSIGNED";
              const dropAddress = order.address || order.deliveryAddress;
              const customerFee = Number(order.customerDeliveryFee !== undefined ? order.customerDeliveryFee : (order.deliveryFee || 0));
              const riderPayout = Number(order.riderPayout !== undefined ? order.riderPayout : (customerFee > 0 ? customerFee : 25));

              return (
                <div
                  key={order.id}
                  className="p-5 rounded-2xl border border-emerald-300 bg-emerald-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900">
                        Order #{order.orderNumber || order.id}
                      </span>
                      <span className="text-[10px] bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full uppercase">
                        {String(currentStatus).replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-0.5 font-medium">
                      <p className="flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        Store: <strong className="text-slate-900 font-bold">{order.shop?.name || "Partner Supermarket"}</strong>
                      </p>
                      <p className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        Drop: <span className="text-slate-800">{dropAddress?.addressLine1 || "Customer Delivery Address"}</span>
                      </p>
                    </div>

                    {/* Items pills */}
                    {order.items && order.items.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <span
                            key={item.id || idx}
                            className="bg-white border border-slate-200 px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-800 shadow-2xs"
                          >
                            <strong className="text-indigo-600 font-black">{item.quantity}x</strong> {item.name || item.product?.name || item.productName || "Item"}
                          </span>
                        ))}
                        {order.items.length > 3 && (
                          <span className="text-[11px] text-slate-500 font-semibold self-center">
                            +{order.items.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs pt-1">
                      <span className="text-slate-600">
                        Bill Fee: <strong className="text-slate-900 font-bold">₹{customerFee}.00</strong>
                      </span>
                      <span className="text-emerald-700 font-bold">
                        Rider Earning: <strong>₹{riderPayout}.00</strong>
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/delivery/order/${order.id}`}
                    className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all shrink-0 cursor-pointer"
                  >
                    Fulfill Trip <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
