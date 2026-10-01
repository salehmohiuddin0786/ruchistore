"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Store,
  MapPin,
  Clock,
  Bike,
  ShieldCheck,
  Receipt,
  Phone,
  AlertTriangle,
} from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";

export default function OrderDetailPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const orderId = unwrappedParams.id;
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/orders/${orderId}`);
      if (res.data?.success) {
        setOrder(res.data.data?.order || res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      setCancelling(true);
      const res = await apiClient.post(`/orders/${orderId}/cancel`, {
        reason: "Customer cancelled from app",
      });
      if (res.data?.success) {
        showToast("Order cancelled successfully", "info");
        loadOrder();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Cannot cancel order at this stage", "error");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-4">
        <div className="h-8 w-48 bg-slate-200/60 rounded-xl animate-pulse" />
        <div className="h-64 bg-slate-200/60 rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Order Not Found</h2>
        <Link href="/orders" className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs">
          View All Orders
        </Link>
      </div>
    );
  }

  const currentStatus = order?.orderStatus || order?.order_status || "PLACED";
  const isLive = !["DELIVERED", "CANCELLED", "REFUNDED"].includes(currentStatus);
  const canCancel = currentStatus === "PLACED";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Order #{order.orderNumber || order.id}
            </h1>
            <p className="text-xs text-slate-500">
              Placed on {new Date(order.createdAt || order.created_at || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLive && (
            <Link
              href={`/orders/${order.id}/tracking`}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Bike className="w-4 h-4" />
              Live Tracking
            </Link>
          )}
          {canCancel && (
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition-colors"
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Items and Store */}
        <div className="md:col-span-2 space-y-6">
          {/* Shop Card */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase text-slate-400">Sold & Packed By</h3>
                <p className="text-sm font-bold text-slate-900">{order.shop?.name || "Partner Store"}</p>
                <p className="text-[11px] text-slate-500">{order.shop?.address}</p>
              </div>
            </div>
            {order.shop?.phone && (
              <a
                href={`tel:${order.shop.phone}`}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Delivery Partner (if assigned) */}
          {order.deliveryPartner && (
            <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase text-emerald-800">Delivery Partner Assigned</h3>
                  <p className="text-sm font-black text-emerald-950">{order.deliveryPartner.user?.name || "Ramesh Kumar"}</p>
                  <p className="text-[11px] text-emerald-700">Vehicle: {order.deliveryPartner.vehicleNumber || "Two Wheeler"}</p>
                </div>
              </div>
              {order.deliveryPartner.user?.phone && (
                <a
                  href={`tel:${order.deliveryPartner.user.phone}`}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Rider
                </a>
              )}
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
              Items Ordered ({order.items?.length || 0})
            </h3>
            <div className="space-y-3">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 p-1 border border-slate-100 shrink-0">
                      <img
                        src={item.product?.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100"}
                        alt={item.product?.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{item.name || item.product?.name || "Grocery Item"}</h4>
                      <p className="text-[11px] text-slate-400">
                        {item.quantity} x ₹{item.unitPrice || item.discount_price || item.price || 0}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-900">
                    ₹{item.totalPrice || item.total_price || (item.quantity * (item.discount_price || item.price || 0))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Address and Invoice Summary */}
        <div className="space-y-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Delivery Address
            </h3>
            {order.deliveryAddress || order.address ? (
              <div className="text-xs text-slate-700 space-y-1">
                <span className="font-bold text-slate-900 block">{(order.deliveryAddress || order.address).type || "Home"}</span>
                <p>
                  {(order.deliveryAddress || order.address).flat || (order.deliveryAddress || order.address).house_flat
                    ? `${(order.deliveryAddress || order.address).flat || (order.deliveryAddress || order.address).house_flat}, `
                    : ""}
                  {(order.deliveryAddress || order.address).addressLine1 || (order.deliveryAddress || order.address).address_line}
                </p>
                <p className="text-slate-400">
                  {(order.deliveryAddress || order.address).city} - {(order.deliveryAddress || order.address).pincode}
                </p>
                {order.deliveryInstructions && (
                  <p className="pt-2 text-[11px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-100">
                    Note: {order.deliveryInstructions}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Doorstep delivery address on file.</p>
            )}
          </div>

          {/* Payment & Invoice */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-indigo-600" /> Payment & Charges
            </h3>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>₹{order.subtotal || 0}</span>
              </div>
              {(order.discount || order.discountAmount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount Applied</span>
                  <span>- ₹{order.discount || order.discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery Charge</span>
                <span>{(order.deliveryFee || order.delivery_fee) === 0 ? "FREE" : `₹${order.deliveryFee || order.delivery_fee || 0}`}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (5%)</span>
                <span>₹{order.tax || order.taxAmount || 0}</span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-black text-slate-900">Total Amount</span>
                <span className="text-xl font-black text-slate-900">₹{order.totalAmount || order.total_amount || 0}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Payment Status:</span>
              <span className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] ${
                (order.paymentStatus || order.payment_status) === "PAID"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}>
                {order.paymentStatus || order.payment_status || "PENDING"} ({order.paymentMethod || order.payment_method || "COD"})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
