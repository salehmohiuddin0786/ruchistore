import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </Link>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
            <p className="text-xs text-slate-400">Last updated: January 2026 • Ruchi Store Technologies Pvt Ltd</p>
          </div>
        </div>

        <div className="prose prose-slate text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            At <strong>Ruchi Store</strong>, your privacy and data security are our top priorities. This Privacy Policy details how we collect, use, and safeguard personal information when you use the Ruchi Store quick-commerce application, website, and delivery services.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">1. Information We Collect</h3>
          <p>
            We collect personal information necessary to deliver groceries to your doorstep, including your name, contact phone number, email address, physical delivery addresses, landmark, and GPS coordinates for precision 10-15 minute routing.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">2. How We Use Your Data</h3>
          <p>
            Your information is used exclusively to:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Process and dispatch grocery orders from local neighborhood partner stores.</li>
            <li>Enable real-time tracking between customer and assigned delivery partner.</li>
            <li>Send order confirmation, SMS OTP authentication, and status notifications.</li>
            <li>Prevent fraudulent transactions and protect inventory reservations.</li>
          </ul>

          <h3 className="text-sm font-bold text-slate-900 pt-2">3. Payment Information</h3>
          <p>
            Payment transactions made via UPI, Debit/Credit Cards, or Netbanking are encrypted and processed securely by RBI-compliant payment gateways (such as Razorpay). Ruchi Store never stores your full card numbers, CVVs, or bank account PINs.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">4. Third-Party Sharing</h3>
          <p>
            We only share delivery-relevant details (customer name, delivery address, phone) with the assigned partner store and active delivery partner fulfilling that specific order. We never sell or rent your personal information to third-party advertisers.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">5. Data Retention & Your Rights</h3>
          <p>
            You have the right to inspect, edit, or delete your account data, saved addresses, and order history at any time by contacting privacy@ruchistore.com.
          </p>
        </div>
      </div>
    </div>
  );
}
