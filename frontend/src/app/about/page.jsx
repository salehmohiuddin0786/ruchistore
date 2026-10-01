import React from "react";
import Link from "next/link";
import { ShoppingBag, Zap, Heart, ShieldCheck, ArrowLeft, Users, Store } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </Link>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-8">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-500 flex items-center justify-center text-white shadow-md">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">About Ruchi Store</h1>
            <p className="text-xs text-slate-500">The 10-Minute Neighborhood Grocery Delivery Network</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
          <p>
            <strong>Ruchi Store</strong> is a modern Indian quick-commerce technology platform that connects neighborhood grocery stores and supermarkets directly with urban households.
          </p>

          <p>
            Rather than displacing local brick-and-mortar kiranas, Ruchi Store empowers them. By giving neighborhood merchants advanced inventory and order management software, we enable them to fulfill customer orders faster than ever—delivering fresh milk, vegetables, bakery products, and daily essentials in 10-15 minutes.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <Zap className="w-6 h-6 text-amber-500" />
              <h4 className="text-sm font-bold text-slate-900">Hyperfast Delivery</h4>
              <p className="text-xs text-slate-500">Average delivery time under 12 minutes in supported zones.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <Store className="w-6 h-6 text-indigo-500" />
              <h4 className="text-sm font-bold text-slate-900">Empowering Local Stores</h4>
              <p className="text-xs text-slate-500">Over 50+ verified partner supermarkets and growing.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-900">100% Fresh & Authentic</h4>
              <p className="text-xs text-slate-500">Strict quality audits and instant refunds for damaged goods.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
