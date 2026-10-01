"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  Store,
  Package,
  Layers,
  ShoppingBag,
  Bike,
  Tag,
  CreditCard,
  RotateCcw,
  IndianRupee,
  Star,
  HelpCircle,
  Image,
  Bell,
  BarChart3,
  Settings,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, loading, login, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [adminEmail, setAdminEmail] = useState("admin@store");
  const [adminPassword, setAdminPassword] = useState("Admin@123");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    const res = await login(adminEmail, adminPassword);
    setLoginLoading(false);
    if (!res.success) {
      setLoginError(res.message);
    } else if (res.user.role !== "ADMIN") {
      setLoginError("This account does not have SuperAdmin permissions.");
    }
  };

  const adminNavSections = [
    {
      title: "Core",
      links: [
        { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/orders", label: "All Orders", icon: ShoppingBag },
      ],
    },
    {
      title: "Management",
      links: [
        { href: "/admin/shops", label: "Partner Shops", icon: Store },
        { href: "/admin/delivery-partners", label: "Delivery Fleet", icon: Bike },
        { href: "/admin/users", label: "Users & Customers", icon: Users },
        { href: "/admin/products", label: "Products Catalogue", icon: Package },
        { href: "/admin/categories", label: "Categories", icon: Layers },
      ],
    },
    {
      title: "Finance & Operations",
      links: [
        { href: "/admin/payments", label: "Payments & Revenue", icon: CreditCard },
        { href: "/admin/commissions", label: "Store Commissions", icon: IndianRupee },
        { href: "/admin/coupons", label: "Offers & Coupons", icon: Tag },
        { href: "/admin/support", label: "Help Tickets", icon: HelpCircle },
      ],
    },
  ];

  if (!loading && (!isAuthenticated || !isAdmin)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">SuperAdmin Console</h1>
              <p className="text-xs text-slate-400">Ruchi Store Management Portal</p>
            </div>
          </div>

          <div className="bg-indigo-950/40 border border-indigo-800/40 rounded-2xl p-4 text-xs space-y-1.5">
            <p className="font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Standard Admin Credentials
            </p>
            <p className="text-slate-300 font-mono">Mail: <strong className="text-white">admin@store</strong></p>
            <p className="text-slate-300 font-mono">Pass: <strong className="text-white">Admin@123</strong></p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {loginError && (
              <p className="text-xs font-semibold text-rose-400 bg-rose-950/50 p-3 rounded-xl border border-rose-800/50">
                {loginError}
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Admin Username / Email
              </label>
              <input
                type="text"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm outline-hidden focus:border-indigo-500"
                placeholder="admin@store"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-white font-medium text-sm outline-hidden focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {loginLoading ? "Authenticating..." : "Sign In to SuperAdmin"}
            </button>
          </form>

          <div className="pt-2 text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Customer Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-black text-sm">SuperAdmin Console</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-400 hover:text-white"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between p-4 transition-transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6 overflow-y-auto">
          {/* Logo & Return */}
          <div className="flex items-center justify-between pt-1 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-600/30">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="font-black text-sm block">RUCHI STORE</span>
                <span className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider">
                  SuperAdmin
                </span>
              </div>
            </div>
            <Link href="/" title="Back to Customer App" className="text-slate-500 hover:text-slate-300">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Navigation Sections */}
          <nav className="space-y-6">
            {adminNavSections.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3">
                  {sec.title}
                </span>
                <div className="space-y-0.5 pt-1">
                  {sec.links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                          isActive
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {link.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Footer Admin info & Sign Out */}
        <div className="pt-4 border-t border-slate-800 text-xs text-slate-500 space-y-2">
          <div>
            <p className="font-bold text-slate-300">{user?.name || "SuperAdmin"}</p>
            <p className="text-[11px] font-mono text-indigo-400 truncate">{user?.email || "admin@store"}</p>
          </div>
          <button
            onClick={logout}
            className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 bg-slate-950 p-4 sm:p-6 lg:p-8 min-h-screen overflow-x-hidden flex flex-col justify-between">
        <div>{children}</div>

        {/* SuperAdmin Portal Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-800/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 DigitalCrowdTech. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span>Unit No 203, 2nd Floor Suite No.806, SBR CV Towers, Madhapur, Hyderabad – TG</span>
            <a href="https://digitalcrowdtech.in/#" target="_blank" rel="noreferrer" className="text-indigo-400 font-bold hover:underline">
              @digitalcrowdtech
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}
