"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  IndianRupee,
  ShoppingBag,
  Store,
  Bike,
  Users,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle,
} from "lucide-react";
import apiClient from "../../../api/apiClient";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalShops: 4,
    totalDeliveryPartners: 2,
    activeOrdersCount: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, ordersRes] = await Promise.allSettled([
        apiClient.get("/admin/stats"),
        apiClient.get("/admin/orders?limit=6"),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value.data?.success) {
        const d = statsRes.value.data.data || {};
        const s = d.stats || {};
        setStats({
          totalRevenue: d.totalRevenue !== undefined ? d.totalRevenue : (s.todayRevenue || 0),
          totalOrders: d.totalOrders !== undefined ? d.totalOrders : (s.todayOrdersCount || 0),
          totalShops: d.totalShops !== undefined ? d.totalShops : (s.totalShops || 0),
          totalDeliveryPartners: d.totalDeliveryPartners !== undefined ? d.totalDeliveryPartners : (s.totalDeliveryPartners || 0),
          activeOrdersCount: d.activeOrdersCount !== undefined ? d.activeOrdersCount : (s.todayOrdersCount || 0),
        });
      }

      if (ordersRes.status === "fulfilled" && ordersRes.value.data?.success) {
        setRecentOrders(ordersRes.value.data.data?.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Platform Overview
        </h1>
        <p className="text-xs text-slate-400">
          Real-time metrics for Ruchi Store quick commerce network
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <IndianRupee className="w-3.5 h-3.5 text-emerald-400" /> Platform GMV
          </span>
          <p className="text-2xl font-black text-white">₹{stats.totalRevenue || 0}</p>
          <span className="text-[11px] text-emerald-400 font-bold">Gross merchandise value</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" /> Total Orders
          </span>
          <p className="text-2xl font-black text-white">{stats.totalOrders || 0}</p>
          <span className="text-[11px] text-slate-400">All customer orders</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-purple-400" /> Partner Shops
          </span>
          <p className="text-2xl font-black text-white">{stats.totalShops || 4}</p>
          <span className="text-[11px] text-purple-400 font-semibold">Active supermarkets</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1.5">
            <Bike className="w-3.5 h-3.5 text-emerald-400" /> Delivery Fleet
          </span>
          <p className="text-2xl font-black text-white">{stats.totalDeliveryPartners || 2}</p>
          <span className="text-[11px] text-emerald-400 font-semibold">Active riders</span>
        </div>
      </div>

      {/* Live Orders Feed */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> Live Platform Order Stream
          </h2>
          <Link href="/admin/orders" className="text-xs font-bold text-indigo-400 hover:underline">
            View All
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            No orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Store</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      #{order.orderNumber || order.id}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-semibold">
                      {order.shop?.name || "Ruchi Mart"}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {order.user?.name || "Customer"}
                    </td>
                    <td className="py-3 px-4 font-black text-white">
                      ₹{order.totalAmount || order.total_amount || 0}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                        {String(order.orderStatus || order.order_status || "PLACED").replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        target="_blank"
                        className="text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
