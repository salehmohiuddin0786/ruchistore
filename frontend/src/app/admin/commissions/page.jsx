"use client";

import React, { useState, useEffect } from "react";
import { IndianRupee, Store, TrendingUp } from "lucide-react";
import apiClient from "../../../api/apiClient";

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState([
    { id: 1, shopName: "Ruchi Mart", gmv: 340, rate: 10, earnedCommission: 34, payoutPending: 306 },
    { id: 2, shopName: "Fresh Basket", gmv: 0, rate: 10, earnedCommission: 0, payoutPending: 0 },
    { id: 3, shopName: "Daily Needs Superstore", gmv: 0, rate: 10, earnedCommission: 0, payoutPending: 0 },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Store Commissions</h1>
        <p className="text-xs text-slate-400">Platform earnings calculated as a percentage of gross partner orders</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Total Commission Earned</span>
          <p className="text-2xl font-black text-emerald-400">₹34.00</p>
          <span className="text-[11px] text-slate-500">10% Platform Take-Rate</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Total Net Merchant Payout</span>
          <p className="text-2xl font-black text-white">₹306.00</p>
          <span className="text-[11px] text-slate-500">Payable to grocery partners</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-1">
          <span className="text-xs font-bold uppercase text-slate-400">Delivery Fleet Payouts</span>
          <p className="text-2xl font-black text-indigo-400">₹45.00</p>
          <span className="text-[11px] text-slate-500">Disbursed to riders</span>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold">
              <tr>
                <th className="py-3.5 px-4">Partner Store</th>
                <th className="py-3.5 px-4">Gross Sales</th>
                <th className="py-3.5 px-4">Commission %</th>
                <th className="py-3.5 px-4">Platform Earned</th>
                <th className="py-3.5 px-4">Net Merchant Payable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{c.shopName}</td>
                  <td className="py-3 px-4 font-black">₹{c.gmv}</td>
                  <td className="py-3 px-4 font-mono">{c.rate}%</td>
                  <td className="py-3 px-4 font-black text-emerald-400">₹{c.earnedCommission}</td>
                  <td className="py-3 px-4 font-black text-white">₹{c.payoutPending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
