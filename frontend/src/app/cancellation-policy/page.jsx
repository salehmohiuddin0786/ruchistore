import React from "react";
import Link from "next/link";
import { XCircle, ArrowLeft } from "lucide-react";

export default function CancellationPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </Link>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Order Cancellation Policy</h1>
            <p className="text-xs text-slate-400">Ruchi Store Quick Commerce Delivery Guidelines</p>
          </div>
        </div>

        <div className="prose prose-slate text-xs sm:text-sm text-slate-600 leading-relaxed space-y-4">
          <p>
            Because <strong>Ruchi Store</strong> operates on an ultra-fast 10-15 minute delivery window, orders are processed and packed by our partner stores immediately after placement.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">1. Cancellation by Customer</h3>
          <p>
            You may cancel your grocery order free of charge while it is in the <strong>"PLACED"</strong> status, before the partner store begins packing. Once the order advances to <strong>"PACKING"</strong>, <strong>"READY_FOR_PICKUP"</strong>, or <strong>"OUT_FOR_DELIVERY"</strong>, cancellation is no longer possible through the application because perishable items have already been weighed, packed, and sealed.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">2. Cancellation by Ruchi Store or Partner Store</h3>
          <p>
            In rare events where an ordered item is discovered to be out of stock during packing, or if extreme weather prevents delivery partners from safely riding, the store or system may cancel the affected order. In such events, a 100% full refund is initiated immediately.
          </p>

          <h3 className="text-sm font-bold text-slate-900 pt-2">3. Unreachable at Delivery Location</h3>
          <p>
            If a delivery partner arrives at the designated delivery address and is unable to reach the customer via phone or doorbell after 10 minutes, the order may be marked cancelled without a refund for perishable produce.
          </p>
        </div>
      </div>
    </div>
  );
}
