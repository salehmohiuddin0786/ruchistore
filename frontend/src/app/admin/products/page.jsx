"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Package, Search } from "lucide-react";
import apiClient from "../../../api/apiClient";

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/products?limit=50");
      if (res.data?.success) {
        setProducts(res.data.data?.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.shop?.name && p.shop.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Products Catalogue</h1>
          <p className="text-xs text-slate-400">All grocery products listed across verified partner stores</p>
        </div>

        <div className="relative w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products or stores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-800/60 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 p-8 space-y-2 text-slate-400">
            <Package className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-bold">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold">
                <tr>
                  <th className="py-3.5 px-4">Item</th>
                  <th className="py-3.5 px-4">Store</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Stock</th>
                  <th className="py-3.5 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100"}
                          alt={p.name}
                          className="w-9 h-9 object-contain rounded-xl bg-slate-800 p-1 shrink-0"
                        />
                        <span className="font-bold text-white block truncate max-w-xs">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-300">
                      {p.shop?.name || "Ruchi Mart"}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {p.category?.name || "Grocery"}
                    </td>
                    <td className="py-3 px-4 font-black text-white">
                      ₹{p.discountPrice || p.price}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {p.stock} units
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/product/${p.id}`}
                        target="_blank"
                        className="text-indigo-400 hover:text-indigo-300 font-bold"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
