"use client";

import React, { useState, useEffect } from "react";
import { Layers, Plus, Package } from "lucide-react";
import apiClient from "../../../api/apiClient";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/categories");
      if (res.data?.success) {
        const raw = res.data.data;
        setCategories(Array.isArray(raw) ? raw : (raw?.categories || []));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Grocery Departments</h1>
        <p className="text-xs text-slate-400">All quick-commerce grocery categories available on Ruchi Store</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {categories.map((c) => (
          <div
            key={c.id}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex items-center gap-3.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/60 border border-indigo-800 text-indigo-400 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1">{c.name}</h3>
              <span className="text-[11px] text-slate-500 font-mono">/{c.slug}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
