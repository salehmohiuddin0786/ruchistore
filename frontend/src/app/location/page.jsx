"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  Crosshair,
  Search,
  Check,
  Home,
  Briefcase,
  Navigation,
  Plus,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../api/apiClient";
import { useToast } from "../../context/ToastContext";

const POPULAR_AREAS = [
  { name: "Madhapur", city: "Hyderabad", pincode: "500081", lat: 17.4485, lng: 78.3908 },
  { name: "Hitec City", city: "Hyderabad", pincode: "500081", lat: 17.4435, lng: 78.3772 },
  { name: "Gachibowli", city: "Hyderabad", pincode: "500032", lat: 17.4401, lng: 78.3489 },
  { name: "Kondapur", city: "Hyderabad", pincode: "500084", lat: 17.4682, lng: 78.3582 },
  { name: "Jubilee Hills", city: "Hyderabad", pincode: "500033", lat: 17.4319, lng: 78.4073 },
  { name: "Banjara Hills", city: "Hyderabad", pincode: "500034", lat: 17.4156, lng: 78.4347 },
];

export default function LocationPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New address form state
  const [formData, setFormData] = useState({
    type: "HOME",
    addressLine1: "",
    flat: "",
    landmark: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "500081",
    latitude: 17.4485,
    longitude: 78.3908,
    deliveryInstructions: "",
    isDefault: false,
  });

  const [currentLocation, setCurrentLocation] = useState(POPULAR_AREAS[0]);

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
    if (isAuthenticated) {
      loadAddresses();
    }
  }, [isAuthenticated]);

  const loadAddresses = async () => {
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
        setAddresses(addrs);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLocation = (loc) => {
    setCurrentLocation(loc);
    if (typeof window !== "undefined") {
      localStorage.setItem("ruchi_delivery_location", JSON.stringify(loc));
    }
    showToast(`Delivery location set to ${loc.name || loc.addressLine1 || loc.city}`, "success");
    setTimeout(() => router.push("/"), 500);
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser", "error");
      return;
    }
    showToast("Detecting GPS location...", "info");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const detected = {
          name: "Current GPS Location",
          city: "Hyderabad",
          pincode: "500081",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        handleSelectLocation(detected);
      },
      () => {
        showToast("Could not detect GPS location. Please choose from the list.", "warning");
      }
    );
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!formData.addressLine1 || !formData.pincode) {
      showToast("Please enter address and pincode", "error");
      return;
    }

    try {
      const res = await apiClient.post("/addresses", formData);
      if (res.data?.success) {
        showToast("Address saved successfully!", "success");
        setShowAddForm(false);
        loadAddresses();
        handleSelectLocation(res.data.data);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save address", "error");
    }
  };

  const handleDeleteAddress = async (id, e) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/addresses/${id}`);
      showToast("Address removed", "info");
      loadAddresses();
    } catch (err) {
      showToast("Failed to remove address", "error");
    }
  };

  const filteredAreas = POPULAR_AREAS.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.pincode.includes(search)
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Delivery Location</h1>
          <p className="text-xs text-slate-500">Pick where you want your groceries delivered in 10-15 mins</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search locality, street, or pincode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm shadow-xs focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-hidden transition-all"
          />
        </div>

        {/* GPS Button */}
        <button
          onClick={handleDetectGPS}
          className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-md shadow-emerald-500/20 hover:brightness-105 active:scale-98 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Crosshair className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="block text-sm">Use Current GPS Location</span>
              <span className="block text-xs text-emerald-100 font-normal">Detect exact location automatically</span>
            </div>
          </div>
          <Navigation className="w-5 h-5" />
        </button>

        {/* Saved Addresses Section */}
        {isAuthenticated && (
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Your Saved Addresses
              </h2>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
              >
                <Plus className="w-4 h-4" />
                {showAddForm ? "Cancel" : "Add New Address"}
              </button>
            </div>

            {/* Add Address Form */}
            {showAddForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                onSubmit={handleCreateAddress}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
              >
                <div className="flex gap-2">
                  {["HOME", "WORK", "OTHER"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: t })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        formData.type === t
                          ? "bg-emerald-600 text-white"
                          : "bg-white border border-slate-200 text-slate-700"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="House / Flat / Floor No."
                    value={formData.flat}
                    onChange={(e) => setFormData({ ...formData, flat: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 outline-hidden"
                  />
                  <input
                    type="text"
                    placeholder="Complete Street Address *"
                    required
                    value={formData.addressLine1}
                    onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 outline-hidden"
                  />
                  <input
                    type="text"
                    placeholder="Landmark (Optional)"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 outline-hidden"
                  />
                  <input
                    type="text"
                    placeholder="Pincode *"
                    required
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 outline-hidden"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Delivery Instructions (e.g., Leave at door, ring bell)"
                  value={formData.deliveryInstructions}
                  onChange={(e) => setFormData({ ...formData, deliveryInstructions: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 outline-hidden"
                />

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700"
                  >
                    Save & Deliver Here
                  </button>
                </div>
              </motion.form>
            )}

            {/* Address List */}
            {addresses.length === 0 && !loading ? (
              <p className="text-xs text-slate-400 py-2">No saved addresses yet.</p>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr) => {
                  const isSelected =
                    currentLocation?.id === addr.id ||
                    currentLocation?.addressLine1 === addr.addressLine1;

                  return (
                    <div
                      key={addr.id}
                      onClick={() => handleSelectLocation(addr)}
                      className={`flex items-start justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-50/50"
                          : "border-slate-100 hover:border-slate-200 bg-slate-50/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                          {addr.type === "WORK" ? (
                            <Briefcase className="w-4 h-4" />
                          ) : (
                            <Home className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{addr.type}</span>
                            {addr.isDefault && (
                              <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">
                            {addr.flat ? `${addr.flat}, ` : ""}
                            {addr.addressLine1}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {addr.city} - {addr.pincode}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSelected && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
                        <button
                          onClick={(e) => handleDeleteAddress(addr.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Popular Delivery Localities */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Popular Localities in Hyderabad
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredAreas.map((loc) => {
              const isSelected =
                currentLocation?.name === loc.name ||
                currentLocation?.pincode === loc.pincode;

              return (
                <button
                  key={loc.name}
                  onClick={() => handleSelectLocation(loc)}
                  className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/60 font-bold"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">{loc.name}</span>
                      <span className="text-[11px] text-slate-400">
                        {loc.city} ({loc.pincode})
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
