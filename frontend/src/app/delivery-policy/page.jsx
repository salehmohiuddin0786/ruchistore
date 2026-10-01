import React from "react";
import Link from "next/link";
import { Bike, ArrowLeft, Clock, Zap } from "lucide-react";

export default function DeliveryPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </Link>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Bike className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Delivery Policy</h1>
            <p className="text-xs text-slate-400">10-15 Minute Hyperlocal Quick Commerce Standards</p>
          </div>
        </div>

        <div className="prose prose-slate text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            <strong>Ruchi Store</strong> is engineered around high-density hyperlocal micro-warehouses and local verified grocery supermarkets, providing rapid delivery of daily necessities.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">1. Delivery Timeline</h3>
          <p>
            Standard delivery orders are dispatched immediately and delivered within <strong>10 to 15 minutes</strong> under normal traffic and weather conditions within our serviceable radius (typically 2 - 4 km from partner stores).
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">2. Operating Hours</h3>
          <p>
            Deliveries operate daily from <strong>6:00 AM to 12:00 AM (Midnight)</strong>. Orders placed during peak hours may occasionally experience a brief 5-minute surge queue to guarantee rider safety.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">3. Delivery Fees</h3>
          <p>
            - Orders above ₹299 enjoy <strong>FREE Delivery</strong>.<br />
            - Standard delivery fee of ₹25 applies for smaller grocery baskets.<br />
            - Nominal rain or late-night surge charges (₹10 - ₹15) may be applied directly to compensate delivery partners fairly during difficult riding conditions.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">4. Live GPS Tracking & Contactless Delivery</h3>
          <p>
            Customers can monitor their delivery partner in real time on the live tracking screen with interactive coordinates. If you prefer contactless delivery, indicate "Leave at door" in your delivery instructions during checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
