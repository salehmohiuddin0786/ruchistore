"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Crosshair,
  Search,
  Check,
  X,
  Home,
  Briefcase,
  Navigation,
  Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/apiClient";
import { useToast } from "../context/ToastContext";
import { getCurrentGeoAddress } from "../lib/geo";

const POPULAR_LOCALITIES = [
  { name: "Madhapur", city: "Hyderabad", pincode: "500081", lat: 17.4485, lng: 78.3908 },
  { name: "Hitec City", city: "Hyderabad", pincode: "500081", lat: 17.4435, lng: 78.3772 },
  { name: "Gachibowli", city: "Hyderabad", pincode: "500032", lat: 17.4401, lng: 78.3489 },
  { name: "Kondapur", city: "Hyderabad", pincode: "500084", lat: 17.4682, lng: 78.3582 },
  { name: "Jubilee Hills", city: "Hyderabad", pincode: "500033", lat: 17.4319, lng: 78.4073 },
  { name: "Banjara Hills", city: "Hyderabad", pincode: "500034", lat: 17.4156, lng: 78.4347 },
];

export default function LocationSelector({ isOpen, onClose, onSelectLocation }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(POPULAR_LOCALITIES[0]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ruchi_delivery_location");
      if (saved) {
        try {
          setCurrentLocation(JSON.parse(saved));
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchAddresses();
    }
  }, [isOpen, isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/addresses");
      if (res.data?.success) {
        const raw = res.data.data;
        const addrs = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.addresses)
          ? raw.addresses
          : Array.isArray(res.data?.addresses)
          ? res.data.addresses
          : [];
        setSavedAddresses(addrs);
      }
    } catch (err) {
      console.error("Failed to load saved addresses", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (loc) => {
    setCurrentLocation(loc);
    if (typeof window !== "undefined") {
      localStorage.setItem("ruchi_delivery_location", JSON.stringify(loc));
    }
    if (onSelectLocation) onSelectLocation(loc);
    showToast(`Delivering to ${loc.name || loc.addressLine1 || loc.city}`, "success");
    if (onClose) onClose();
  };

  const handleDetectGPS = async () => {
    try {
      showToast("Detecting your exact GPS location...", "info");
      const geo = await getCurrentGeoAddress();
      const detected = {
        name: geo.addressLine || "Current Location",
        city: geo.city,
        pincode: geo.pincode,
        lat: geo.latitude,
        lng: geo.longitude,
      };
      handleSelect(detected);
    } catch (err) {
      showToast(err.message || "Unable to detect location. Please select from list.", "warning");
    }
  };

  if (!isOpen) return null;

  const filteredLocalities = POPULAR_LOCALITIES.filter((loc) =>
    loc.name.toLowerCase().includes(search.toLowerCase()) ||
    loc.city.toLowerCase().includes(search.toLowerCase()) ||
    loc.pincode.includes(search)
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border border-slate-100 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Choose Delivery Location</h3>
                <p className="text-xs text-slate-500">Groceries delivered in 10-15 minutes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Search location */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search area, landmark or pincode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100/80 border border-slate-200/60 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-hidden transition-all"
              />
            </div>

            {/* GPS Detection Button */}
            <button
              onClick={handleDetectGPS}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Crosshair className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block text-emerald-900">
                    Use Current GPS Location
                  </span>
                  <span className="text-[11px] text-emerald-600">
                    Using device high-accuracy sensor
                  </span>
                </div>
              </div>
              <Navigation className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Saved Addresses (if any) */}
            {isAuthenticated && savedAddresses.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Saved Addresses
                </h4>
                <div className="space-y-2">
                  {savedAddresses.map((addr) => {
                    const isSelected =
                      currentLocation?.id === addr.id ||
                      (currentLocation?.addressLine1 &&
                        currentLocation.addressLine1 === addr.addressLine1);

                    return (
                      <div
                        key={addr.id}
                        onClick={() => handleSelect(addr)}
                        className={`flex items-start justify-between p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-50/30"
                            : "border-slate-100 hover:border-slate-200 bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-slate-200/70 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                            {addr.type === "WORK" ? (
                              <Briefcase className="w-3.5 h-3.5" />
                            ) : (
                              <Home className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="text-xs">
                            <span className="font-bold text-slate-800 block">
                              {addr.type || "Home"}
                            </span>
                            <p className="text-slate-600 line-clamp-1">
                              {addr.flat ? `${addr.flat}, ` : ""}
                              {addr.addressLine1}
                            </p>
                            <span className="text-slate-400">
                              {addr.city} • {addr.pincode}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-1" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Popular Localities */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Popular Quick Delivery Localities
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {filteredLocalities.map((loc) => {
                  const isSelected =
                    currentLocation?.name === loc.name ||
                    currentLocation?.pincode === loc.pincode;

                  return (
                    <button
                      key={loc.name}
                      onClick={() => handleSelect(loc)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/50 text-emerald-900 font-bold"
                          : "border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div>
                        <span className="text-xs font-semibold block">{loc.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {loc.city} ({loc.pincode})
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
            ⚡ All local partner shops deliver within an estimated 10-15 minutes.
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
