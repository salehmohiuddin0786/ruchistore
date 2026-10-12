"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Search, Filter, ArrowRight } from "lucide-react";
import apiClient from "../../../api/apiClient";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/orders");
      if (res.data?.success) {
        setOrders(res.data.data?.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = orders.filter((o) => {
    const matchesStatus = statusFilter === "ALL" || o.orderStatus === statusFilter;
    const matchesSearch =
      (o.orderNumber && o.orderNumber.toLowerCase().includes(search.toLowerCase())) ||
      (o.shop?.name && o.shop.name.toLowerCase().includes(search.toLowerCase())) ||
      (o.user?.name && o.user.name.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Platform Orders</h1>
          <p className="text-xs text-slate-400">Audit all customer purchases and fulfillment status</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search Order # or Store..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-hidden focus:border-indigo-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            <option value="PLACED">PLACED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="PACKING">PACKING</option>
            <option value="READY_FOR_PICKUP">READY FOR PICKUP</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-800/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 p-8 space-y-2 text-slate-400">
            <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-bold">No orders found matching filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Store</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Delivery Partner</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      #{order.orderNumber || order.id}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">
                      {order.shop?.name || "Ruchi Mart"}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div className="font-medium text-slate-200">
                        {order.recipientName || order.recipient_name || order.user?.name || "Customer"}
                      </div>
                      {(order.recipientName || order.recipient_name) ? (
                        <div className="text-[10px] text-purple-400 font-bold">
                          🎁 Recipient (by {order.user?.name || "User"})
                        </div>
                      ) : null}
                      {(order.recipientPhone || order.recipient_phone || order.user?.phone) && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          📞 +91 {order.recipientPhone || order.recipient_phone || order.user?.phone}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-emerald-400">
                      {order.deliveryPartner?.user?.name || "Assigning..."}
                    </td>
                    <td className="py-3 px-4 font-black text-white">
                      ₹{order.totalAmount || order.total_amount || 0}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      {order.paymentMethod || order.payment_method} ({order.paymentStatus || order.payment_status})
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
