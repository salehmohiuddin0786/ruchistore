import React from "react";
import Link from "next/link";
import { FileText, ArrowLeft } from "lucide-react";

export default function TermsAndConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </Link>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Terms and Conditions</h1>
            <p className="text-xs text-slate-400">Effective Date: January 2026 • Ruchi Store Platform</p>
          </div>
        </div>

        <div className="prose prose-slate text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            Welcome to <strong>Ruchi Store</strong>. By accessing or using our website, mobile application, or customer ordering interface, you agree to be bound by these Terms and Conditions.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">1. Nature of the Service</h3>
          <p>
            Ruchi Store is an on-demand quick-commerce platform that connects consumers with local neighborhood grocery stores, supermarkets, and independent delivery partners. All products sold on Ruchi Store are daily groceries, fresh produce, dairy, bakery, snacks, and household essentials.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">2. Single-Store Cart Constraint</h3>
          <p>
            To fulfill orders within our promised 10-15 minute delivery window, orders are strictly fulfilled from a single partner grocery store at a time. Adding items from another store will prompt you to replace or complete your current cart.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">3. Product Pricing & Stock</h3>
          <p>
            All listed prices include applicable GST. Real-time inventory locks are placed when an order is submitted to guarantee item availability. Prices are server-authoritative and determined by our partner stores and verified system calculation.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">4. User Account & Conduct</h3>
          <p>
            Users must provide accurate phone numbers and delivery addresses. Any account found abusing promotional coupons, engaging in fraudulent payment disputes, or providing false coordinates may be suspended.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">5. Governing Law</h3>
          <p>
            These terms are governed by the laws of India, under the jurisdiction of courts in Hyderabad, Telangana.
          </p>
        </div>
      </div>
    </div>
  );
}
