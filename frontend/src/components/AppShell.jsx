"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import MobileBottomNav from "./MobileBottomNav";
import CartDrawer from "./CartDrawer";
import ReplaceCartModal from "./ReplaceCartModal";
import AuthModal from "./AuthModal";
import Footer from "./Footer";
import LocationSelector from "./LocationSelector";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const [authOpen, setAuthOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);

  // Check if current route belongs to a portal
  const isPortalRoute =
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/shop-owner") ||
    pathname?.startsWith("/delivery");

  if (isPortalRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100">
        <main className="flex-1 w-full">{children}</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Customer Navbar */}
      <Navbar
        onOpenAuth={() => setAuthOpen(true)}
        onOpenLocation={() => setLocationOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 w-full pb-20 md:pb-0">
        {children}
      </main>

      {/* Customer Footer */}
      <Footer />

      {/* Overlays / Modals */}
      <CartDrawer />
      <ReplaceCartModal />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      <LocationSelector
        isOpen={locationOpen}
        onClose={() => setLocationOpen(false)}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav onOpenAuth={() => setAuthOpen(true)} />
    </div>
  );
}
