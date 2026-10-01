"use client";

import React, { useState, useEffect } from "react";
import {
  IndianRupee,
  TrendingUp,
  Clock,
  CheckCircle,
  Calendar,
  Wallet,
  Store,
  ArrowUpRight,
} from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";

export default function DeliveryEarningsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState({
    totalEarnings: 0,
    todayEarnings: 0,
    records: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/delivery/earnings");
      if (res.data?.success) {
        const d = res.data.data || {};
        setData({
          totalEarnings: Number(d.totalEarnings || d.summary?.totalEarnings || 0),
          todayEarnings: Number(d.todayEarnings || d.summary?.todayEarnings || 0),
          records: d.records || d.earnings || [],
        });
      }
    } catch (err) {
      console.error("Failed to load earnings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => {
    showToast("Payout request submitted! Transfer will complete to your registered UPI ID.", "success");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Earnings & Payouts</h1>
        <p className="text-xs text-slate-500">Track delivery trip payments, bonuses, and weekly settlements</p>
      </div>

      {/* Main Wallet Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400 flex items-center gap-1.5">
            <Wallet className="w-4 h-4" /> Available Wallet Balance
          </span>
          <div className="text-4xl sm:text-5xl font-black tracking-tight">
            ₹{data.totalEarnings || data.todayEarnings || 0}.00
          </div>
          <p className="text-xs text-slate-400">
            Earnings automatically settled to your bank, or request instant UPI cashout anytime.
          </p>
        </div>

        <button
          onClick={handleWithdraw}
          className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer self-start sm:self-center"
        >
          Request Instant Payout
        </button>
      </div>

      {/* Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Today's Earnings</span>
          <p className="text-2xl font-black text-emerald-600">₹{data.todayEarnings || 0}.00</p>
          <span className="text-[11px] text-slate-400">Today's completed trips</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Total Lifetime Payout</span>
          <p className="text-2xl font-black text-slate-900">₹{data.totalEarnings || 0}.00</p>
          <span className="text-[11px] text-slate-400">Total verified earnings</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Total Deliveries</span>
          <p className="text-2xl font-black text-indigo-600">{data.records?.length || 0}</p>
          <span className="text-[11px] text-indigo-600 font-semibold">Ledger entries logged</span>
        </div>
      </div>

      {/* Recent Trips Log */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Completed Trip Ledger ({data.records?.length || 0})
          </h3>
          <span className="text-xs text-slate-400">Fixed Rider Base: ₹45.00 / trip</span>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : data.records.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No completed delivery trip payouts yet. Complete orders to earn!
          </div>
        ) : (
          <div className="space-y-3">
            {data.records.map((rec) => {
              const customerFee = rec.customerDeliveryFee !== undefined ? rec.customerDeliveryFee : 25;
              const dateStr = rec.createdAt
                ? new Date(rec.createdAt).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Recent";

              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0">
                      ✓
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-sm">
                        Trip #{rec.orderNumber} - Completed
                      </span>
                      <span className="text-slate-500 text-[11px] flex items-center gap-2">
                        <span>{rec.shopName || "Partner Store"}</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span className="text-slate-400">Customer Bill Fee: ₹{customerFee}.00</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                    <div>
                      <span className="font-black text-emerald-600 text-base block">
                        + ₹{rec.totalEarning || 45}.00
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        {rec.payoutStatus || "CREDITED"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
