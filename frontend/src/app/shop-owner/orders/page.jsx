"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  Package,
  Bike,
  UserCheck,
  X,
  Phone,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";

export default function ShopOwnerOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Delivery Partner Assignment State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loadingPartners, setLoadingPartners] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/shop-owner/orders");
      if (res.data?.success) {
        setOrders(res.data.data?.orders || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await apiClient.put(`/shop-owner/orders/${orderId}/status`, {
        status: newStatus,
      });
      if (res.data?.success) {
        showToast(`Order marked as ${String(newStatus || "").replace(/_/g, " ")}!`, "success");
        loadOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update order status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  // Open delivery partner assignment modal
  const openAssignModal = async (order) => {
    setSelectedOrderForAssign(order);
    setSelectedPartnerId(order.deliveryPartnerId || order.deliveryPartner?.id || null);
    setIsAssignModalOpen(true);
    try {
      setLoadingPartners(true);
      const res = await apiClient.get("/shop-owner/delivery-partners");
      if (res.data?.success) {
        setPartners(res.data.data?.partners || []);
      }
    } catch (err) {
      showToast("Could not load delivery partners", "error");
    } finally {
      setLoadingPartners(false);
    }
  };

  // Confirm delivery partner assignment
  const handleConfirmAssign = async () => {
    if (!selectedOrderForAssign || !selectedPartnerId) {
      showToast("Please select a delivery partner", "error");
      return;
    }

    try {
      setAssigning(true);
      const res = await apiClient.post(
        `/shop-owner/orders/${selectedOrderForAssign.id}/assign-delivery`,
        { deliveryPartnerId: selectedPartnerId }
      );

      if (res.data?.success) {
        showToast(res.data.message || "Delivery partner assigned successfully!", "success");
        setIsAssignModalOpen(false);
        setSelectedOrderForAssign(null);
        setSelectedPartnerId(null);
        loadOrders();
      } else {
        showToast(res.data?.message || "Failed to assign delivery partner", "error");
      }
    } catch (err) {
      showToast(
        err.response?.data?.message || "Error assigning delivery partner",
        "error"
      );
    } finally {
      setAssigning(false);
    }
  };

  const filtered = orders.filter((o) => {
    if (tab === "new") return ["PLACED", "CONFIRMED"].includes(o.orderStatus);
    if (tab === "packing") return o.orderStatus === "PACKING";
    if (tab === "ready") return ["READY_FOR_PICKUP", "ASSIGNED", "PICKED_UP"].includes(o.orderStatus);
    if (tab === "delivered") return o.orderStatus === "DELIVERED";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Store Orders</h1>
          <p className="text-xs text-slate-500">Pack items quickly and assign delivery partners for 10-15 minute delivery</p>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-xs">
          {["all", "new", "packing", "ready", "delivered"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                tab === t
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-44 rounded-3xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No {tab} orders found</h3>
          <p className="text-xs text-slate-400">Orders placed by customers will appear in this queue.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const hasPartner = Boolean(order.deliveryPartner);
            const canAssign = ["PLACED", "CONFIRMED", "PACKING", "READY_FOR_PICKUP", "ASSIGNED"].includes(order.orderStatus);

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      #{order.id}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        Order #{order.orderNumber || order.id}
                      </h3>
                      {order.recipientName || order.recipient_name ? (
                        <p className="text-[11px] text-purple-700 font-bold">
                          🎁 Deliver To: {order.recipientName || order.recipient_name} (📞 +91 {order.recipientPhone || order.recipient_phone}){" "}
                          <span className="text-slate-400 font-normal">
                            • Buyer: {order.user?.name || order.customer?.name || "Customer"} • {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Customer: {order.user?.name || order.customer?.name || "Customer"} {order.user?.phone ? `(📞 +91 ${order.user.phone})` : ""} • {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs px-3 py-1 rounded-full font-bold uppercase bg-purple-50 text-purple-700 border border-purple-200">
                      {String(order.orderStatus || order.order_status || "PLACED").replace(/_/g, " ")}
                    </span>
                    <span className="text-base font-black text-slate-900">
                      ₹{order.totalAmount || order.total_amount || 0}
                    </span>
                  </div>
                </div>

                {/* Delivery Partner Assignment Banner */}
                {hasPartner ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                        <Bike className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-indigo-950">
                            Rider: {order.deliveryPartner?.user?.name || "Assigned Partner"}
                          </p>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                            {order.deliveryPartner?.vehicle_type || order.deliveryPartner?.vehicleType || "BIKE"}
                          </span>
                        </div>
                        <p className="text-[11px] text-indigo-600 mt-0.5 flex items-center gap-2">
                          <span>📞 {order.deliveryPartner?.user?.phone || "N/A"}</span>
                          {order.deliveryPartner?.user?.email && <span>• {order.deliveryPartner?.user?.email}</span>}
                        </p>
                      </div>
                    </div>
                    {canAssign && (
                      <button
                        onClick={() => openAssignModal(order)}
                        className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs shadow-2xs transition-colors cursor-pointer self-start sm:self-center"
                      >
                        Change Rider
                      </button>
                    )}
                  </div>
                ) : (
                  canAssign && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold">No delivery partner assigned yet</p>
                          <p className="text-[11px] text-amber-700">Assign a rider now so they can head to your store immediately.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => openAssignModal(order)}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-center"
                      >
                        <Bike className="w-4 h-4" />
                        Assign Delivery Partner
                      </button>
                    </div>
                  )
                )}

                {/* Items Packing Checklist */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Packing List ({order.items?.length || 0} items):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between items-center py-1">
                        <span className="text-slate-800 font-semibold">
                          • {item.quantity}x {item.name || item.product?.name || "Grocery Item"}
                        </span>
                        <span className="text-slate-500 font-mono">₹{item.totalPrice}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons for Order Progress */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Payment: <strong>{order.paymentMethod}</strong> ({order.paymentStatus})
                  </div>

                  <div className="flex items-center gap-2">
                    {order.orderStatus === "PLACED" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "CONFIRMED")}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Accept Order
                      </button>
                    )}

                    {order.orderStatus === "CONFIRMED" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "PACKING")}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        Start Packing Items
                      </button>
                    )}

                    {order.orderStatus === "PACKING" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "READY_FOR_PICKUP")}
                        disabled={updatingId === order.id}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Sealed & Ready for Pickup
                      </button>
                    )}

                    {canAssign && (
                      <button
                        onClick={() => openAssignModal(order)}
                        className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Bike className="w-4 h-4" />
                        {hasPartner ? "Reassign Rider" : "Assign Rider"}
                      </button>
                    )}

                    {order.orderStatus === "DELIVERED" && (
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        ✓ Fulfilled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delivery Partner Selection Modal */}
      {isAssignModalOpen && selectedOrderForAssign && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Assign Delivery Partner</h3>
                <p className="text-xs text-slate-500">
                  Order #{selectedOrderForAssign.orderNumber || selectedOrderForAssign.id} • ₹{selectedOrderForAssign.totalAmount || selectedOrderForAssign.total_amount || 0}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingPartners ? (
              <div className="py-8 text-center space-y-2">
                <div className="animate-spin w-6 h-6 border-3 border-purple-600 border-t-transparent rounded-full mx-auto" />
                <p className="text-xs text-slate-500">Finding available delivery partners...</p>
              </div>
            ) : partners.length === 0 ? (
              <div className="py-8 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-100 p-4">
                <Bike className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">No approved delivery partners found</p>
                <p className="text-[11px] text-slate-400">All registered partners are currently offline or busy.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Select Delivery Executive:
                </p>
                <div className="space-y-2">
                  {partners.map((partner) => {
                    const isCurrent =
                      selectedOrderForAssign.deliveryPartnerId === partner.id ||
                      selectedOrderForAssign.deliveryPartner?.id === partner.id;
                    const isSelected = selectedPartnerId === partner.id;

                    return (
                      <div
                        key={partner.id}
                        onClick={() => setSelectedPartnerId(partner.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "border-purple-600 bg-purple-50/60 shadow-xs ring-2 ring-purple-600/20"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold relative shrink-0">
                            <Bike className="w-5 h-5 text-purple-600" />
                            {partner.isOnline && (
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white absolute top-0 right-0" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-bold text-slate-900">{partner.name}</span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                {partner.vehicleType}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                                  Currently Assigned
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              📞 {partner.phone} • ⭐ {partner.rating} ({partner.totalDeliveries} deliveries)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {partner.isOnline ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              Online
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                              Offline
                            </span>
                          )}
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? "border-purple-600 bg-purple-600"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedPartnerId || assigning}
                onClick={handleConfirmAssign}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none transition-all cursor-pointer flex items-center gap-1.5"
              >
                {assigning ? (
                  <span>Assigning Rider...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Assignment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
