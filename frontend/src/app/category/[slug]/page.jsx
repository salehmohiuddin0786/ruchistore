"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, SlidersHorizontal, Package, Sparkles } from "lucide-react";
import apiClient from "../../../api/apiClient";
import ProductCard from "../../../components/ProductCard";

export default function CategoryDetailPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const slug = unwrappedParams.slug;

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("default");

  useEffect(() => {
    if (slug) {
      loadCategoryData();
    }
  }, [slug]);

  const loadCategoryData = async () => {
    try {
      setLoading(true);
      // Fetch category details
      const catRes = await apiClient.get(`/categories/${slug}`);
      if (catRes.data?.success) {
        const catData = catRes.data.data;
        const catObj = catData?.category || catData;
        setCategory(catObj);
        if (catData?.products && Array.isArray(catData.products) && catData.products.length > 0) {
          setProducts(catData.products);
        }
      }

      // Fetch products for category
      const prodRes = await apiClient.get(`/products?category=${slug}&limit=40`);
      if (prodRes.data?.success && prodRes.data.data?.products?.length > 0) {
        setProducts(prodRes.data.data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <Link href="/categories" className="hover:underline">Categories</Link>
            <span>/</span>
            <span className="text-slate-800 font-bold">{category?.name || slug}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
            {category?.name || "Grocery Department"}
          </h1>
        </div>
      </div>

      {/* Filter and Count Bar */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <span className="text-xs font-bold text-slate-600">
          Showing {sortedProducts.length} items
        </span>

        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-hidden cursor-pointer"
          >
            <option value="default">Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Top Customer Rated</option>
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-64 rounded-3xl bg-slate-200/60 animate-pulse" />
          ))}
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No products available in this category yet</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Our partner grocery stores are restocking items for this department. Please check back soon!
          </p>
          <Link
            href="/"
            className="inline-block mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
          >
            Back to Homepage
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {sortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
