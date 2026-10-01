"use client";

import React, { useState, useEffect } from "react";
import { IndianRupee, TrendingUp, Calendar, Wallet } from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";

export default function ShopOwnerEarningsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState({
    grossSales: 340,
    platformCommission: 34,
    netPayable: 306,
    settledAmount: 0,
  });

  const handleRequestPayout = () => {
    showToast("Payout request submitted! Net proceeds will be credited to your merchant bank account.", "success");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Store Revenue & Settlements</h1>
        <p className="text-xs text-slate-500">Track gross grocery sales, 10% platform commission, and net merchant balance</p>
      </div>

      {/* Main Net Revenue Card */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400 flex items-center gap-1.5">
            <Wallet className="w-4 h-4" /> Net Store Payout Balance
          </span>
          <div className="text-4xl sm:text-5xl font-black">
            ₹{data.netPayable}.00
          </div>
          <p className="text-xs text-slate-400">
            Platform commissions and customer taxes automatically accounted for.
          </p>
        </div>

        <button
          onClick={handleRequestPayout}
          className="px-6 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-purple-600/30 transition-all cursor-pointer self-start sm:self-center"
        >
          Withdraw Store Payout
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Gross Grocery Sales</span>
          <p className="text-2xl font-black text-slate-900">₹{data.grossSales}.00</p>
          <span className="text-[11px] text-slate-400">Total customer orders</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Platform Commission (10%)</span>
          <p className="text-2xl font-black text-amber-600">- ₹{data.platformCommission}.00</p>
          <span className="text-[11px] text-slate-400">Hosting & rider dispatch fee</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Net Merchant Earnings</span>
          <p className="text-2xl font-black text-emerald-600">₹{data.netPayable}.00</p>
          <span className="text-[11px] text-emerald-600 font-semibold">Available for transfer</span>
        </div>
      </div>
    </div>
  );
}
