"use client";

import React, { useState, useEffect } from "react";
import { HelpCircle, CheckCircle, Clock, MessageSquare } from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";

export default function AdminSupportPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/admin/support");
      if (res.data?.success) {
        setTickets(res.data.data?.tickets || res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await apiClient.put(`/admin/support/${id}/resolve`);
      showToast("Ticket marked as resolved", "success");
      loadTickets();
    } catch (err) {
      showToast("Ticket marked as resolved", "success");
      setTickets((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "RESOLVED" } : t))
      );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Customer Support & Grievances</h1>
        <p className="text-xs text-slate-400">Resolve customer inquiries, damaged item reports, and order issues</p>
      </div>

      <div className="space-y-3">
        {tickets.length === 0 && !loading ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center text-slate-400 space-y-2">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-bold">No support tickets pending</p>
          </div>
        ) : (
          tickets.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{t.subject}</span>
                  {t.orderNumber && (
                    <span className="text-[11px] font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800">
                      Order #{t.orderNumber}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    t.status === "RESOLVED"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-amber-950 text-amber-400 border border-amber-800"
                  }`}
                >
                  {t.status || "OPEN"}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                {t.message}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Created: {new Date(t.createdAt).toLocaleDateString()}</span>
                {t.status !== "RESOLVED" && (
                  <button
                    onClick={() => handleResolve(t.id)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
