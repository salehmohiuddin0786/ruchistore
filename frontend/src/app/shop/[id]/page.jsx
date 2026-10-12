"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Store,
  Star,
  Clock,
  MapPin,
  Search,
  ArrowLeft,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Package,
} from "lucide-react";
import apiClient from "../../../api/apiClient";
import ProductCard from "../../../components/ProductCard";

export default function ShopDetailPage({ params }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const shopId = unwrappedParams.id;

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    if (shopId) {
      loadShopAndProducts();
    }
  }, [shopId]);

  const loadShopAndProducts = async () => {
    try {
      setLoading(true);
      const [shopRes, prodRes] = await Promise.allSettled([
        apiClient.get(`/shops/${shopId}`),
        apiClient.get(`/products?shopId=${shopId}&limit=50`),
      ]);

      let loadedProducts = [];

      if (shopRes.status === "fulfilled" && shopRes.value.data?.success) {
        const raw = shopRes.value.data.data;
        const shopObj = raw?.shop || raw;
        setShop(shopObj);
        if (shopObj?.products?.length > 0) {
          loadedProducts = shopObj.products;
        }
      }

      if (prodRes.status === "fulfilled" && prodRes.value.data?.success) {
        const pList = prodRes.value.data.data?.products;
        if (Array.isArray(pList) && pList.length > 0) {
          loadedProducts = pList;
        }
      }

      setProducts(loadedProducts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Derive categories from store's products
  const categoryMap = new Map();
  products.forEach((p) => {
    if (p.category) {
      categoryMap.set(p.category.id, p.category.name);
    } else if (p.category_id || p.categoryId) {
      const cId = p.category_id || p.categoryId;
      categoryMap.set(cId, `Category ${cId}`);
    }
  });
  const shopCategories = Array.from(categoryMap.entries()).map(([id, name]) => ({ id, name }));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" ||
      p.category_id === selectedCategory ||
      p.categoryId === selectedCategory ||
      p.category?.id === selectedCategory ||
      String(p.category_id) === String(selectedCategory) ||
      String(p.categoryId) === String(selectedCategory) ||
      String(p.category?.id) === String(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* GroceryStore JSON-LD Schema for Local SEO */}
      {shop && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "GroceryStore",
              name: shop.name,
              image: shop.logo || shop.cover_image || "/store-placeholder.png",
              telephone: shop.phone || "+91-9999999999",
              address: {
                "@type": "PostalAddress",
                streetAddress: shop.address || "Main Road",
                addressLocality: shop.city || "Hyderabad",
                postalCode: shop.pincode || "500081",
                addressCountry: "IN",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: shop.latitude || 17.4485,
                longitude: shop.longitude || 78.3908,
              },
              openingHours: "Mo-Su 07:00-23:00",
              priceRange: "₹₹",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: String(shop.rating || "4.8"),
                reviewCount: "85",
              },
            }),
          }}
        />
      )}

      {/* Top Back Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-xs text-slate-500 font-medium">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/shops" className="hover:underline">Stores</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-800 font-bold">{shop?.name || "Shop Details"}</span>
        </div>
      </div>

      {/* Shop Profile Header */}
      {shop && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Banner */}
          <div className="h-36 sm:h-48 w-full bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 relative overflow-hidden">
            {(shop.cover_image || shop.banner_image || shop.coverImage || shop.bannerImage) && (
              <img
                src={shop.cover_image || shop.banner_image || shop.coverImage || shop.bannerImage}
                alt={shop.name}
                className="w-full h-full object-cover opacity-60"
              />
            )}
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                (shop.is_open ?? shop.isOpen ?? true)
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "bg-red-500 text-white shadow-xs"
              }`}>
                {(shop.is_open ?? shop.isOpen ?? true) ? "🟢 Open Now" : "🔴 Closed"}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="p-6 relative">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-2xl bg-white p-2 shadow-lg border border-slate-100 shrink-0">
                  {shop.logo ? (
                    <img
                      src={shop.logo}
                      alt={shop.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Store className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {shop.name}
                  </h1>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {shop.address || "Local Partner Store, Hyderabad"}
                  </p>
                </div>
              </div>

              {/* Stats badges */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl text-amber-800 text-xs font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>{shop.rating || "4.8"} (100+ ratings)</span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-emerald-800 text-xs font-bold">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>⚡ 10-15 mins delivery</span>
                </div>
              </div>
            </div>

            {/* Description / Notice */}
            {shop.description && (
              <p className="text-xs text-slate-600 mt-4 leading-relaxed max-w-3xl">
                {shop.description}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Filter and In-Shop Search */}
      {/* Store Closed Banner or Products Filter */}
      {shop && !(shop.is_open ?? shop.isOpen ?? true) ? (
        <div className="p-8 rounded-3xl bg-amber-50 border border-amber-200 text-center space-y-3">
          <Clock className="w-12 h-12 text-amber-600 mx-auto" />
          <h3 className="text-lg font-black text-amber-950">This Store is Currently Closed</h3>
          <p className="text-xs text-amber-800 max-w-md mx-auto leading-relaxed">
            <strong>{shop.name}</strong> is currently not accepting new orders. Product catalogue is paused until the store re-opens. Please check back during opening hours or explore other active partner stores nearby!
          </p>
          <div className="pt-2">
            <Link
              href="/shops"
              className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700"
            >
              Browse Open Partner Stores
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All Products ({products.length})
              </button>
              {shopCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors cursor-pointer ${
                    selectedCategory === c.id
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Search within store */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search items in this store..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-100 text-xs text-slate-900 border border-slate-200 outline-hidden focus:bg-white focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-64 rounded-3xl bg-slate-200/60 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
              <Package className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No items match your filter in this store</p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                }}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
