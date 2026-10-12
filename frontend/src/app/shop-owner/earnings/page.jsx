"use client";

import React, { useState, useEffect } from "react";
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  Wallet,
  RefreshCw,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Building2,
  AlertCircle,
  X,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";

export default function ShopOwnerEarningsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [earningsData, setEarningsData] = useState({
    shopName: "Your Store",
    grossSales: 0,
    commissionRate: 10,
    totalCommission: 0,
    netEarnings: 0,
    netPayable: 0,
    activeOrdersCount: 0,
    activeSales: 0,
    deliveredOrdersCount: 0,
    orders: [],
  });

  // Payout withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState("upi"); // 'upi' | 'bank'
  const [upiId, setUpiId] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);
  const [lastPayoutRef, setLastPayoutRef] = useState(null);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      setRefreshing(true);
      const res = await apiClient.get("/shop-owner/earnings");
      if (res.data?.success) {
        const d = res.data.data;
        setEarningsData({
          shopName: d.shopName || "Your Store",
          grossSales: Number(d.grossSales || 0),
          commissionRate: Number(d.commissionRate || 10),
          totalCommission: Number(d.totalCommission || 0),
          netEarnings: Number(d.netEarnings || 0),
          netPayable: Number(d.netPayable || 0),
          activeOrdersCount: Number(d.activeOrdersCount || 0),
          activeSales: Number(d.activeSales || 0),
          deliveredOrdersCount: Number(d.deliveredOrdersCount || 0),
          orders: Array.isArray(d.orders) ? d.orders : [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch earnings:", err);
      showToast(err.response?.data?.message || "Failed to load store earnings", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenWithdraw = () => {
    if (earningsData.netPayable <= 0) {
      showToast(
        "You currently have ₹0.00 in available net payout balance. Completed sales are required before requesting withdrawal.",
        "warning"
      );
      return;
    }
    setShowWithdrawModal(true);
  };

  const handleSubmitWithdraw = async (e) => {
    e.preventDefault();
    if (earningsData.netPayable <= 0) return;

    if (withdrawMethod === "upi" && !upiId.trim()) {
      showToast("Please enter a valid UPI ID (e.g. merchant@okhdfcbank)", "warning");
      return;
    }

    if (withdrawMethod === "bank" && (!bankAccountNumber.trim() || !ifscCode.trim())) {
      showToast("Please provide Bank Account Number and IFSC Code", "warning");
      return;
    }

    try {
      setSubmittingPayout(true);
      const payload = {
        amount: earningsData.netPayable,
        upiId: withdrawMethod === "upi" ? upiId.trim() : null,
        bankAccountNumber: withdrawMethod === "bank" ? bankAccountNumber.trim() : null,
        ifscCode: withdrawMethod === "bank" ? ifscCode.trim() : null,
      };

      const res = await apiClient.post("/shop-owner/payout-request", payload);
      if (res.data?.success) {
        setLastPayoutRef(res.data.data?.referenceId || "REF-COMPLETED");
        showToast(
          res.data.message ||
            `Payout request for ₹${earningsData.netPayable.toFixed(2)} submitted! Ref: ${res.data.data?.referenceId}`,
          "success"
        );
        setShowWithdrawModal(false);
        // Refresh live data
        fetchEarnings();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to submit payout request", "error");
    } finally {
      setSubmittingPayout(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with Title and Live Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Store Revenue & Settlements
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-700 border border-purple-200">
              {earningsData.shopName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time grocery sales, platform commission ({earningsData.commissionRate}%), and net payout ledger
          </p>
        </div>

        <button
          onClick={fetchEarnings}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-purple-600" : ""}`} />
          {refreshing ? "Updating..." : "Refresh Ledger"}
        </button>
      </div>

      {/* Main Net Revenue Card */}
      <div className="bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6 border border-purple-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 z-10">
          <span className="text-xs uppercase font-extrabold tracking-widest text-purple-400 flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-purple-400" /> Net Store Payout Balance
          </span>
          <div className="text-4xl sm:text-5xl font-black tracking-tight text-white flex items-baseline gap-1">
            <span>₹</span>
            <span>{earningsData.netPayable.toFixed(2)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-1">
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60 text-[11px] font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              100% Genuine Ledger
            </span>
            <span>Platform commissions and delivery charges automatically deducted.</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 z-10">
          <button
            onClick={handleOpenWithdraw}
            disabled={earningsData.netPayable <= 0}
            className={`px-6 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
              earningsData.netPayable > 0
                ? "bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/40 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                : "bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700"
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            Withdraw Store Payout
          </button>
        </div>
      </div>

      {/* 3 Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Gross Sales */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1.5 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Gross Grocery Sales</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900">₹{earningsData.grossSales.toFixed(2)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Delivered orders total</span>
            <span className="font-bold text-slate-600">{earningsData.deliveredOrdersCount} orders</span>
          </div>
        </div>

        {/* Platform Commission */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1.5 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Platform Fee ({earningsData.commissionRate}%)
            </span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-600">- ₹{earningsData.totalCommission.toFixed(2)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Hosting & dispatch fee</span>
            <span className="font-bold text-amber-600">{earningsData.commissionRate}% auto-split</span>
          </div>
        </div>

        {/* Net Merchant Earnings */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-1.5 hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Net Merchant Share</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600">₹{earningsData.netEarnings.toFixed(2)}</p>
          <div className="flex items-center justify-between text-[11px] text-emerald-600 font-semibold pt-0.5">
            <span>Available for withdrawal</span>
            <span>Instant</span>
          </div>
        </div>
      </div>

      {/* Active Pipeline Card (if active orders exist) */}
      {earningsData.activeOrdersCount > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <Clock className="w-4 h-4 animate-spin" />
            </span>
            <div>
              <p className="text-xs font-bold text-amber-900">
                In-Transit / Packing Orders: ₹{earningsData.activeSales.toFixed(2)}
              </p>
              <p className="text-[11px] text-amber-700">
                {earningsData.activeOrdersCount} customer order(s) currently active. Settlement balance updates upon delivery.
              </p>
            </div>
          </div>
          <span className="text-xs font-black text-amber-800 bg-amber-200/60 px-3 py-1 rounded-full">
            In Pipeline
          </span>
        </div>
      )}

      {/* Order Settlement History */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Delivered Orders Breakdown</h2>
            <p className="text-xs text-slate-400">Order-by-order gross value and platform deductions</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
            {earningsData.orders.length} Settled
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
            <p className="text-xs font-semibold">Loading settlement transactions...</p>
          </div>
        ) : earningsData.orders.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No Delivered Orders Yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Once orders from {earningsData.shopName} are marked <strong>Delivered</strong> by delivery riders, your gross earnings and net payout breakdown will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Order ID</th>
                  <th className="py-3 px-4">Date & Customer</th>
                  <th className="py-3 px-4 text-right">Gross Subtotal</th>
                  <th className="py-3 px-4 text-right">Fee ({earningsData.commissionRate}%)</th>
                  <th className="py-3 px-4 text-right">Net Store Share</th>
                  <th className="py-3 px-4 sm:px-6 text-center">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {earningsData.orders.map((order) => {
                  const gross = Number(order.subtotal || order.total_amount || order.totalAmount || 0);
                  const fee = (gross * earningsData.commissionRate) / 100;
                  const net = gross - fee;
                  const dateStr = order.createdAt || order.created_at
                    ? new Date(order.createdAt || order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Delivered";

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-bold text-slate-900">
                        #{order.orderNumber || order.order_number || order.id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="font-semibold text-slate-800">{order.customer?.name || "Customer"}</div>
                        <div className="text-[11px] text-slate-400">{dateStr}</div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        ₹{gross.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-amber-600">
                        - ₹{fee.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-emerald-600">
                        ₹{net.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Settled
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Withdraw Store Payout</h3>
                <p className="text-xs text-slate-500">Transfer net merchant balance to your account</p>
              </div>
              <button
                onClick={() => setShowWithdrawModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitWithdraw} className="p-6 space-y-4 text-xs">
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 space-y-1">
                <span className="text-[11px] font-bold uppercase text-purple-700">Available Payout Amount</span>
                <p className="text-3xl font-black text-purple-950">₹{earningsData.netPayable.toFixed(2)}</p>
                <p className="text-[10px] text-purple-600">Standard transfer window: 24 to 48 business hours</p>
              </div>

              {/* Method Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Select Payout Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod("upi")}
                    className={`py-2.5 px-3 rounded-xl font-bold border text-xs cursor-pointer transition-all ${
                      withdrawMethod === "upi"
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    UPI ID (Fast)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWithdrawMethod("bank")}
                    className={`py-2.5 px-3 rounded-xl font-bold border text-xs cursor-pointer transition-all ${
                      withdrawMethod === "bank"
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Bank Account
                  </button>
                </div>
              </div>

              {/* UPI Field */}
              {withdrawMethod === "upi" ? (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Enter Merchant UPI ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. 9490140848@paytm or store@okhdfcbank"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold placeholder:text-slate-400 outline-hidden focus:bg-white focus:border-purple-500"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Account Holder Name *</label>
                    <input
                      type="text"
                      required
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="e.g. Rafi Nana Kirana"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold placeholder:text-slate-400 outline-hidden focus:bg-white focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bank Account Number *</label>
                    <input
                      type="text"
                      required
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="Enter Bank Account Number"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold placeholder:text-slate-400 outline-hidden focus:bg-white focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Bank IFSC Code *</label>
                    <input
                      type="text"
                      required
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value)}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-semibold placeholder:text-slate-400 outline-hidden uppercase focus:bg-white focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/20 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {submittingPayout ? "Submitting..." : "Confirm Withdrawal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
