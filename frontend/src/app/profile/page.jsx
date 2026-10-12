"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Heart,
  HelpCircle,
  LogOut,
  Store,
  Bike,
  ShieldCheck,
  ChevronRight,
  Edit2,
  Check,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import apiClient from "../../api/apiClient";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isAdmin, isShopOwner, isDeliveryPartner, updateUser } = useAuth();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone && !user.phone.startsWith("g_") ? user.phone : "");
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setPhone(user.phone && !user.phone.startsWith("g_") ? user.phone : "");
    }
  }, [user]);



  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone && cleanPhone.length !== 10) {
      showToast("Please enter a valid 10-digit mobile number", "error");
      return;
    }

    try {
      setSaving(true);
      const res = await apiClient.put("/user/profile", {
        name,
        email,
        phone: cleanPhone || undefined,
      });
      if (res.data?.success) {
        showToast("Profile updated successfully", "success");
        if (res.data.data?.user) {
          updateUser(res.data.data.user);
        }
        setIsEditing(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute
      title="My Profile"
      description="Sign in to view and manage your account details, mobile number, and preferences."
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name}</h1>
            <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
              <Phone className="w-3.5 h-3.5" />{" "}
              {user?.phone && !user.phone.startsWith("g_") ? `+91 ${user.phone}` : "No phone linked"}
            </p>
            {user?.email && (
              <p className="text-xs text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </p>
            )}
            <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700">
              Role: {user?.role}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Edit2 className="w-3.5 h-3.5" /> {isEditing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
        >
          <h2 className="text-sm font-bold text-slate-900">Update Profile Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-hidden focus:bg-white focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 select-none">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile"
                  className="w-full pl-11 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-hidden focus:bg-white focus:border-emerald-500 transition-colors font-medium"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 outline-hidden focus:bg-white focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      {/* Role-Specific Portal Links */}
      {(isAdmin || isShopOwner || isDeliveryPartner) && (
        <div className="bg-slate-900 rounded-3xl p-5 text-white shadow-md space-y-3">
          <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-400">
            Partner & Admin Portals
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {isShopOwner && (
              <Link
                href="/shop-owner/dashboard"
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-between text-xs font-bold transition-all"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-purple-400" />
                  <span>Shop Owner Portal</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            )}

            {isDeliveryPartner && (
              <Link
                href="/delivery/dashboard"
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-between text-xs font-bold transition-all"
              >
                <div className="flex items-center gap-2">
                  <Bike className="w-4 h-4 text-emerald-400" />
                  <span>Delivery Partner App</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/admin/dashboard"
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-between text-xs font-bold transition-all"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <span>Admin Console</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Account Navigation Links */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden text-xs">
        <Link
          href="/orders"
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-800">My Orders & Invoices</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          href="/addresses"
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-800">Saved Delivery Addresses</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          href="/favorites"
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Heart className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-800">Wishlist & Saved Items</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        <Link
          href="/support"
          className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-800">Help Center & Support</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* Sign Out Button */}
      <div className="pt-2">
        <button
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="w-full p-4 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
      </div>
    </ProtectedRoute>
  );
}
