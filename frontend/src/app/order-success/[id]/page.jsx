"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  MapPin,
  Bike,
  ArrowRight,
  Package,
  ShoppingBag,
} from "lucide-react";
import apiClient from "../../../api/apiClient";

export default function OrderSuccessPage({ params }) {
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/orders/${orderId}`);
      if (res.data?.success) {
        setOrder(res.data.data?.order || res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
      {/* Animated Checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", damping: 12, stiffness: 200 }}
        className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10"
      >
        <CheckCircle className="w-14 h-14" />
      </motion.div>

      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Order Placed Successfully!
        </h1>
        <p className="text-sm text-slate-500">
          Your order <span className="font-mono font-bold text-slate-800">#{order?.orderNumber || order?.order_number || orderId}</span> has been confirmed by Ruchi Store.
        </p>
      </div>

      {/* 10 Min Guarantee Box */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-emerald-50 border border-emerald-200/80 rounded-3xl p-6 text-left space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-950">Arriving in 10-15 Minutes</h3>
            <p className="text-xs text-emerald-800">
              The store is packing your fresh items now. A delivery partner is being assigned.
            </p>
          </div>
        </div>

        {order && (
          <div className="pt-3 border-t border-emerald-200/60 text-xs space-y-2 text-emerald-900">
            <div className="flex justify-between">
              <span className="text-emerald-700">Total Paid:</span>
              <span className="font-black text-sm">₹{order.totalAmount || order.total_amount || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700">Payment:</span>
              <span className="font-bold">{(order.paymentMethod || order.payment_method) === "COD" ? "Cash on Delivery" : "Online Payment"}</span>
            </div>
            {(order.address || order.deliveryAddress) && (
              <div className="flex justify-between items-start gap-4">
                <span className="text-emerald-700 shrink-0">Delivering to:</span>
                <span className="text-right truncate font-medium">
                  {order.address?.addressLine1 || order.address?.address_line || order.deliveryAddress?.address_line || order.deliveryAddress?.addressLine1}, {order.address?.city || order.deliveryAddress?.city}
                </span>
              </div>
            )}
          </div>
        )}
      </motion.div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          href={`/orders/${orderId}/tracking`}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Bike className="w-4 h-4" />
          Track Live Delivery
        </Link>
        <Link
          href={`/orders/${orderId}`}
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-sm shadow-xs transition-all"
        >
          Order Details
        </Link>
        <Link
          href="/"
          className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-sm transition-all"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
