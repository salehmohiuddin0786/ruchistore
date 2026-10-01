"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Layers, ArrowRight } from "lucide-react";
import apiClient from "../../../api/apiClient";

export default function ShopOwnerCategoriesPage() {
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
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Grocery Departments</h1>
        <p className="text-xs text-slate-500">Categories available for your supermarket products</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-3xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between h-36"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 line-clamp-1">
                  {cat.name}
                </h3>
              </div>

              <Link
                href="/shop-owner/products"
                className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center justify-between pt-2 border-t border-slate-100"
              >
                <span>View Products</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
