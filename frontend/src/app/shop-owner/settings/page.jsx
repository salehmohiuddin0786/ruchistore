"use client";

import React, { useState } from "react";
import { Settings, Bell, Volume2, ShieldCheck, Save } from "lucide-react";
import { useToast } from "../../../context/ToastContext";

export default function ShopOwnerSettingsPage() {
  const { showToast } = useToast();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);
  const [notifyLowStock, setNotifyLowStock] = useState(true);

  const handleSave = (e) => {
    e.preventDefault();
    showToast("Store preferences saved successfully", "success");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Store Preferences</h1>
        <p className="text-xs text-slate-500">Configure order alerts, sound chimes, and automatic packing controls</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 text-xs">
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <span className="font-bold text-slate-900 block">Sound Alert for Incoming Orders</span>
              <span className="text-slate-400">Play continuous audio chime when a customer places an order</span>
            </div>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded-sm"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <span className="font-bold text-slate-900 block">Low Stock Warning Notifications</span>
              <span className="text-slate-400">Receive alert when item stock falls below 10 units</span>
            </div>
            <input
              type="checkbox"
              checked={notifyLowStock}
              onChange={(e) => setNotifyLowStock(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded-sm"
            />
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <span className="font-bold text-slate-900 block">Auto-Confirm Placed Orders</span>
              <span className="text-slate-400">Automatically move orders to PACKING if stock is verified</span>
            </div>
            <input
              type="checkbox"
              checked={autoAcceptOrders}
              onChange={(e) => setAutoAcceptOrders(e.target.checked)}
              className="w-4 h-4 text-purple-600 rounded-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
        >
          Save Preferences
        </button>
      </form>
    </div>
  );
}
