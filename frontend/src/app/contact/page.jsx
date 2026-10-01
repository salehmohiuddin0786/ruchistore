import React from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, ArrowLeft, Send } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Store
      </Link>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xs space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Contact Us</h1>
          <p className="text-xs text-slate-500 mt-1">Get in touch with the Ruchi Store team</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400">Headquarters</h4>
                <p className="text-sm font-semibold text-slate-800">
                  Unit No 203, 2nd Floor Suite No.806,<br />
                  SBR CV Towers, Madhapur,<br />
                  Hyderabad – TG
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400">Customer Helpline</h4>
                <p className="text-sm font-semibold text-slate-800">
                  <a href="tel:+919985960692" className="hover:underline">+91 9985960692</a>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400">General Inquiries</h4>
                <p className="text-sm font-semibold text-slate-800">
                  <a href="mailto:support@digitalcrowdtech.in" className="hover:underline">support@digitalcrowdtech.in</a>
                  <br />
                  <a href="https://digitalcrowdtech.in/#" target="_blank" rel="noreferrer" className="text-xs text-indigo-600 font-bold hover:underline">@digitalcrowdtech</a>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400">Service Hours</h4>
                <p className="text-sm font-semibold text-slate-800">6:00 AM - 12:00 AM (Daily)</p>
              </div>
            </div>
          </div>

          {/* Quick Contact Form */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Partner & Merchant Inquiries</h3>
            <p className="text-xs text-slate-500">Want to register your grocery supermarket on Ruchi Store?</p>
            <div className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Store Name or Your Name"
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 outline-hidden"
              />
              <input
                type="tel"
                placeholder="Phone Number"
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 outline-hidden"
              />
              <textarea
                rows={3}
                placeholder="Store location and items you sell..."
                className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 outline-hidden"
              />
              <button
                type="button"
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 shadow-xs"
              >
                Submit Merchant Request
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
