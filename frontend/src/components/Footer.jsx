"use client";

import React from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Zap,
  ShieldCheck,
  Clock,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Heart,
} from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-24 md:pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Value Propositions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">10-Minute Delivery</h4>
              <p className="text-xs text-slate-400">Hyperlocal stores deliver fresh at lightning speed</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% Genuine Quality</h4>
              <p className="text-xs text-slate-400">Fresh vegetables, authentic groceries & staples</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">6 AM - Midnight</h4>
              <p className="text-xs text-slate-400">Order everyday essentials when you need them</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Best Prices & Offers</h4>
              <p className="text-xs text-slate-400">Direct from local shops with daily discounts</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12 border-b border-slate-800">
          {/* Brand & Summary */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2 group inline-block">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-emerald-400 flex items-center justify-center text-white shadow-md">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                RUCHI<span className="text-emerald-400">STORE</span>
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Ruchi Store is your neighborhood quick-commerce platform delivering groceries, fresh fruits, vegetables, dairy, snacks, and daily household essentials straight from local stores to your doorstep in minutes.
            </p>
            <div className="pt-2 flex flex-col gap-1.5 text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Unit No 203, 2nd Floor Suite No.806, SBR CV Towers, Madhapur, Hyderabad – TG
              </span>
              <span className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <a href="mailto:support@digitalcrowdtech.in" className="hover:underline">support@digitalcrowdtech.in</a>
              </span>
              <span className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a href="tel:+919985960692" className="hover:underline">+91 9985960692</a>
              </span>
              <span className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <a href="https://digitalcrowdtech.in/#" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline font-bold">@digitalcrowdtech</a>
              </span>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Top Categories</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/category/fruits" className="hover:text-emerald-400 transition-colors">Fresh Fruits</Link></li>
              <li><Link href="/category/vegetables" className="hover:text-emerald-400 transition-colors">Organic Vegetables</Link></li>
              <li><Link href="/category/dairy" className="hover:text-emerald-400 transition-colors">Dairy, Milk & Curd</Link></li>
              <li><Link href="/category/bakery" className="hover:text-emerald-400 transition-colors">Bakery & Breads</Link></li>
              <li><Link href="/category/rice-grains" className="hover:text-emerald-400 transition-colors">Rice, Atta & Grains</Link></li>
              <li><Link href="/category/snacks" className="hover:text-emerald-400 transition-colors">Snacks & Munchies</Link></li>
              <li><Link href="/category/beverages" className="hover:text-emerald-400 transition-colors">Juices & Cold Drinks</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Customer Support</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/orders" className="hover:text-emerald-400 transition-colors">My Orders</Link></li>
              <li><Link href="/addresses" className="hover:text-emerald-400 transition-colors">Saved Addresses</Link></li>
              <li><Link href="/offers" className="hover:text-emerald-400 transition-colors">Coupons & Offers</Link></li>
              <li><Link href="/shops" className="hover:text-emerald-400 transition-colors">Partner Shops</Link></li>
              <li><Link href="/support" className="hover:text-emerald-400 transition-colors">Help & Grievance</Link></li>
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About Ruchi Store</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Legal Policies */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Policies & Info</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li><Link href="/privacy-policy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms-and-conditions" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/refund-policy" className="hover:text-emerald-400 transition-colors">Refund Policy</Link></li>
              <li><Link href="/cancellation-policy" className="hover:text-emerald-400 transition-colors">Cancellation Policy</Link></li>
              <li><Link href="/delivery-policy" className="hover:text-emerald-400 transition-colors">Delivery Policy</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 DigitalCrowdTech. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Ruchi Store Quick Commerce</span>
            <span className="flex items-center gap-1">
              Made with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for daily grocery delivery
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
