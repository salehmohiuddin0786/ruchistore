import React from "react";
import Link from "next/link";
import { RotateCcw, ArrowLeft } from "lucide-react";

export default function RefundPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </Link>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Refund & Return Policy</h1>
            <p className="text-xs text-slate-400">100% Customer Satisfaction Guarantee • Ruchi Store</p>
          </div>
        </div>

        <div className="prose prose-slate text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            At <strong>Ruchi Store</strong>, we take pride in delivering top-quality fresh groceries. If any item delivered to you does not meet your expectations, we offer a straightforward, hassle-free refund process.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">1. Eligible Scenarios for Refunds</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Item is damaged, spoiled, past expiry date, or defective upon arrival.</li>
            <li>Item missing from the sealed delivery package.</li>
            <li>Incorrect item delivered (wrong brand, wrong quantity, or incorrect weight).</li>
            <li>Order cancelled before store packing begins.</li>
          </ul>

          <h3 className="text-sm font-bold text-slate-900 pt-2">2. Reporting Window</h3>
          <p>
            For perishable items (fresh fruits, vegetables, dairy, bread), please report issues within <strong>4 hours</strong> of delivery. For packaged dry goods (rice, pulses, snacks, household items), issues may be reported within <strong>24 hours</strong>.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">3. Refund Processing Time</h3>
          <p>
            - <strong>UPI & Instant Wallets:</strong> Processed within 2 to 4 business hours.<br />
            - <strong>Cards & Netbanking:</strong> Processed within 3 to 5 business days per standard banking schedules.<br />
            - <strong>Cash on Delivery (COD):</strong> Handled via instant wallet credit or direct UPI transfer to your registered phone number.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">4. Contacting Support</h3>
          <p>
            To initiate a refund, visit our <Link href="/support" className="text-indigo-600 underline font-semibold">Support Center</Link> or email support@ruchistore.com with your Order Number and a picture of the item.
          </p>
        </div>
      </div>
    </div>
  );
}
