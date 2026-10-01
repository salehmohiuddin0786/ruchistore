"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search as SearchIcon,
  X,
  History,
  TrendingUp,
  SlidersHorizontal,
  Package,
  Store,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import apiClient from "../../api/apiClient";
import ProductCard from "../../components/ProductCard";
import ShopCard from "../../components/ShopCard";

const POPULAR_SEARCHES = [
  "Milk",
  "Fresh Banana",
  "Brown Bread",
  "Tomato",
  "Onion",
  "Basmati Rice",
  "Butter",
  "Chips & Snacks",
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState("products"); // 'products' | 'shops' | 'categories'
  const [results, setResults] = useState({ products: [], shops: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [sortBy, setSortBy] = useState("relevance");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ruchi_recent_searches");
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  const performSearch = async (searchTerm) => {
    const term = searchTerm.trim();
    if (!term) return;

    // Save to recents
    const updated = [term, ...recentSearches.filter((s) => s.toLowerCase() !== term.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("ruchi_recent_searches", JSON.stringify(updated));
    }

    try {
      setLoading(true);
      const res = await apiClient.get(`/search?q=${encodeURIComponent(term)}`);
      if (res.data?.success) {
        setResults(res.data.data || { products: [], shops: [], categories: [] });
      }
    } catch (err) {
      console.error("Search error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      performSearch(query);
    }
  };

  const handleSelectKeyword = (keyword) => {
    setQuery(keyword);
    router.push(`/search?q=${encodeURIComponent(keyword)}`);
    performSearch(keyword);
  };

  const handleClearRecents = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("ruchi_recent_searches");
    }
  };

  // Sorting
  const sortedProducts = [...(results.products || [])].sort((a, b) => {
    if (sortBy === "price_low") return a.price - b.price;
    if (sortBy === "price_high") return b.price - a.price;
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    return 0;
  });

  const totalResults =
    (results.products?.length || 0) +
    (results.shops?.length || 0) +
    (results.categories?.length || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Search Header */}
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleFormSubmit} className="relative">
          <SearchIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search groceries, fresh fruits, vegetables, snacks..."
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-sm shadow-sm focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-hidden transition-all"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults({ products: [], shops: [], categories: [] });
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Suggestions / Recents if no active results */}
        {!query && (
          <div className="mt-6 space-y-6">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Recent Searches
                  </span>
                  <button
                    onClick={handleClearRecents}
                    className="text-xs text-slate-400 hover:text-red-500 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectKeyword(term)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:border-emerald-500 hover:text-emerald-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <History className="w-3 h-3 text-slate-400" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular Searches */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-3">
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" /> Popular Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectKeyword(term)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/60 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      {query && (
        <div className="space-y-6">
          {/* Tabs & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("products")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "products"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Products ({results.products?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("shops")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "shops"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Shops ({results.shops?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab("categories")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "categories"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Categories ({results.categories?.length || 0})
              </button>
            </div>

            {/* Sort Select for Products */}
            {activeTab === "products" && results.products?.length > 0 && (
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 outline-hidden cursor-pointer"
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Top Customer Rated</option>
                </select>
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 rounded-3xl bg-slate-200/60 animate-pulse" />
              ))}
            </div>
          )}

          {/* Results Display */}
          {!loading && (
            <div>
              {/* Products Tab */}
              {activeTab === "products" && (
                <div>
                  {sortedProducts.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                      <Package className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">No products found for "{query}"</p>
                      <p className="text-xs text-slate-400">Try searching for generic terms like "milk", "apple", or "bread".</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {sortedProducts.map((p) => (
                        <ProductCard key={p.id} product={p} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Shops Tab */}
              {activeTab === "shops" && (
                <div>
                  {results.shops?.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                      <Store className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">No partner shops match "{query}"</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {results.shops.map((shop) => (
                        <ShopCard key={shop.id} shop={shop} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Categories Tab */}
              {activeTab === "categories" && (
                <div>
                  {results.categories?.length === 0 ? (
                    <div className="text-center py-16 space-y-3">
                      <Package className="w-12 h-12 text-slate-300 mx-auto" />
                      <p className="text-sm font-bold text-slate-700">No categories found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                      {results.categories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => router.push(`/category/${c.slug || c.id}`)}
                          className="p-4 rounded-2xl bg-white border border-slate-200 text-center hover:border-emerald-500 hover:shadow-md transition-all group cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                            <Package className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 block truncate">
                            {c.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-8 text-center text-slate-400">Loading search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
