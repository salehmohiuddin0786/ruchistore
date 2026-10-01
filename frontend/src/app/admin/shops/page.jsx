"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Store, CheckCircle, XCircle, Star, Phone, MapPin } from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";

export default function AdminShopsPage() {
  const { showToast } = useToast();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShops();
  }, []);

  const loadShops = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/shops");
      if (res.data?.success) {
        setShops(res.data.data?.shops || res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApproval = async (shopId, currentStatus) => {
    try {
      const nextApproved = !currentStatus;
      const res = await apiClient.put(`/admin/shops/${shopId}/status`, {
        status: nextApproved ? "APPROVED" : "PENDING",
        isApproved: nextApproved,
      });
      if (res.data?.success) {
        showToast(nextApproved ? "Shop approved successfully!" : "Shop suspended successfully!", "success");
        loadShops();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update shop status", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Partner Grocery Shops</h1>
        <p className="text-xs text-slate-400">Review, approve, and manage supermarket partner merchants</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-3xl bg-slate-900 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400">
          <Store className="w-12 h-12 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-bold">No shops registered yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => {
            const isApproved = shop.isApproved || shop.status === "APPROVED";

            return (
              <div
                key={shop.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-500">ID #{shop.id}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isApproved
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : "bg-amber-950 text-amber-400 border border-amber-800"
                      }`}
                    >
                      {isApproved ? "Approved" : "Pending Approval"}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white">{shop.name}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" /> {shop.address}
                    </p>
                    {shop.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" /> {shop.phone}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {shop.rating || "4.8"}
                    </span>
                    <span>Commission: {shop.commissionRate || shop.commission_percentage || 10}%</span>
                    <span>Min Order: ₹{shop.minOrderAmount || shop.minimum_order || 0}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <Link
                    href={`/shop/${shop.id}`}
                    target="_blank"
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300"
                  >
                    View Storefront
                  </Link>

                  <button
                    onClick={() => handleToggleApproval(shop.id, isApproved)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      isApproved
                        ? "bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    }`}
                  >
                    {isApproved ? "Suspend Shop" : "Approve Shop"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
