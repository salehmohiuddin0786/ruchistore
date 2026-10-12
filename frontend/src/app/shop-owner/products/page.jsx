"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Tag,
  DollarSign,
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  X,
  Image as ImageIcon,
} from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";
import {
  parseProductsCatalogueFile,
  exportToExcel,
  exportToCsv,
} from "../../../utils/spreadsheetParser";

export default function ShopOwnerProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // Bulk Import State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [parsedProducts, setParsedProducts] = useState([]);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const fileInputRef = useRef(null);

  // New product form
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
    price: "",
    discountPrice: "",
    unit: "kg",
    unitValue: "1",
    stock: "50",
    image: "",
    description: "",
    isAvailable: true,
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    loadProductsAndCategories();
  }, []);

  const loadProductsAndCategories = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.allSettled([
        apiClient.get("/shop-owner/products?limit=1000"),
        apiClient.get("/categories"),
      ]);

      if (prodRes.status === "fulfilled" && prodRes.value.data?.success) {
        setProducts(prodRes.value.data.data?.products || prodRes.value.data.data || []);
      }
      if (catRes.status === "fulfilled" && catRes.value.data?.success) {
        const raw = catRes.value.data.data;
        setCategories(Array.isArray(raw) ? raw : raw?.categories || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.categoryId) {
      showToast("Please provide product name, category, and price", "error");
      return;
    }

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("categoryId", formData.categoryId);
      data.append("price", parseFloat(formData.price));
      if (formData.discountPrice) {
        data.append("discountPrice", parseFloat(formData.discountPrice));
      }
      data.append("unit", formData.unit);
      data.append("unitValue", parseFloat(formData.unitValue) || 1);
      data.append("stock", parseInt(formData.stock, 10) || 0);
      data.append("description", formData.description || "");
      data.append("isAvailable", formData.isAvailable);

      if (imageFile) {
        data.append("image", imageFile);
      } else if (formData.image) {
        data.append("image", formData.image);
      }

      const res = await apiClient.post("/shop-owner/products", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.success) {
        showToast("Product added to your store catalogue!", "success");
        setShowAddModal(false);
        setFormData({
          name: "",
          categoryId: "",
          price: "",
          discountPrice: "",
          unit: "kg",
          unitValue: "1",
          stock: "50",
          image: "",
          description: "",
          isAvailable: true,
        });
        setImageFile(null);
        setImagePreview("");
        loadProductsAndCategories();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to add product", "error");
    }
  };

  const handleToggleStock = async (productId, currentStatus) => {
    try {
      await apiClient.put(`/shop-owner/products/${productId}`, {
        isAvailable: !currentStatus,
      });
      showToast("Product availability updated", "success");
      loadProductsAndCategories();
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  /* =========================================================
     CSV / EXCEL TEMPLATES & BULK IMPORT
  ========================================================= */

  const downloadSampleTemplate = () => {
    const templateData = [
      ["Name", "Category", "Price", "Discount Price", "Stock", "Unit", "Unit Value", "Description", "Image URL"],
      ["Fresh Organic Tomatoes", "Vegetables", 45, 38, 100, "kg", "1", "Farm fresh red tomatoes", "https://images.unsplash.com/photo-1546470427-e26264be0b11?w=500"],
      ["Shimla Apples", "Fruits", 140, 120, 60, "kg", "1", "Crisp and sweet mountain apples", "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=500"],
      ["Amul Taaza Milk", "Dairy", 30, 29, 80, "pack", "500ml", "Pasteurized homogenized toned milk", "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500"],
      ["Aashirvaad Whole Wheat Atta", "Staples", 260, 240, 40, "kg", "5", "Superior MP wheat chakki atta", "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500"],
      ["Lay's Classic Salted Potato Chips", "Snacks", 20, 18, 150, "pack", "1", "Crispy sliced salted potato wafers", "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500"],
      ["Tata Tea Gold", "Beverages", 160, 145, 75, "pack", "500g", "Exquisite rich tea granules with gently pressed leaves", "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500"],
      ["Fortune Sunlite Sunflower Oil", "Staples", 135, 125, 90, "L", "1", "Refined sunflower cooking oil pouch", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500"],
      ["Dettol Original Liquid Soap", "Personal Care", 99, 89, 120, "pack", "200ml", "Antibacterial moisturizing hand soap", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500"],
      ["Surf Excel Easy Wash Detergent", "Household", 145, 130, 65, "kg", "1", "Superior fabric detergent powder", "https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?w=500"],
      ["Cadbury Dairy Milk Silk", "Snacks", 80, 75, 200, "piece", "60g", "Velvety smooth pure milk chocolate bar", "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500"],
    ];

    try {
      exportToExcel("ruchi_store_products_catalogue_template.xlsx", "Catalogue Template", templateData);
      showToast("Excel (.xlsx) sample catalogue template downloaded!", "success");
    } catch {
      const csvStr = templateData.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      exportToCsv("ruchi_store_products_catalogue_template.csv", csvStr);
      showToast("CSV sample catalogue template downloaded!", "info");
    }
  };

  const downloadProductDetails = () => {
    if (!products || products.length === 0) {
      showToast("No products found to export", "error");
      return;
    }
    const headers = ["Name", "Category", "Price", "Discount Price", "Stock", "Unit", "Unit Value", "Description", "Image URL", "SKU"];
    const rows = [headers];

    products.forEach((p) => {
      rows.push([
        p.name || "",
        p.category?.name || p.category || "Grocery",
        p.price || 0,
        p.discount_price || p.discountPrice || "",
        p.stock_quantity ?? p.stock ?? 0,
        p.unit || "pack",
        p.unit_value || p.unitValue || "1",
        p.description || "",
        p.image || "",
        p.sku || "",
      ]);
    });

    try {
      exportToExcel(`store_catalogue_${new Date().toISOString().slice(0, 10)}.xlsx`, "Catalogue", rows);
      showToast(`Exported ${products.length} products to Excel (.xlsx)!`, "success");
    } catch {
      const csvStr = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      exportToCsv(`store_catalogue_${new Date().toISOString().slice(0, 10)}.csv`, csvStr);
      showToast(`Exported ${products.length} products to CSV!`, "success");
    }
  };

  const handleBulkFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    try {
      setUploadingBulk(true);
      const parsed = await parseProductsCatalogueFile(file);
      if (!parsed || parsed.length === 0) {
        showToast("No valid products detected. Please verify your column headers.", "error");
        setParsedProducts([]);
      } else {
        setParsedProducts(parsed);
        showToast(`Successfully parsed all ${parsed.length} products from ${file.name}!`, "success");
      }
    } catch (err) {
      console.error("Bulk file parse error:", err);
      showToast(err.message || "Failed to read Excel / CSV file", "error");
      setParsedProducts([]);
    } finally {
      setUploadingBulk(false);
    }
  };

  const handleApplyBulkImport = async () => {
    if (parsedProducts.length === 0) {
      showToast("No valid products found to import", "error");
      return;
    }

    try {
      setUploadingBulk(true);
      const res = await apiClient.post("/shop-owner/products/bulk-import", {
        products: parsedProducts,
      });

      if (res.data?.success) {
        showToast(res.data.message || `Successfully imported all ${parsedProducts.length} products!`, "success");
        setShowBulkModal(false);
        setBulkFile(null);
        setParsedProducts([]);
        loadProductsAndCategories();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to import products", "error");
    } finally {
      setUploadingBulk(false);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Product Catalogue</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Manage your store's grocery items, retail prices, stock availability, and bulk catalog imports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600 shadow-2xs"
            />
          </div>

          <button
            onClick={downloadProductDetails}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Download full products catalogue as CSV"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Download Products List</span>
          </button>

          <button
            onClick={downloadSampleTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Download sample template format"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Sample CSV</span>
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Import Excel / CSV</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 p-8 space-y-3">
            <Package className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No products found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add individual products or upload an Excel/CSV file to start accepting customer orders.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Selling Price</th>
                  <th className="py-3.5 px-4">Stock Units</th>
                  <th className="py-3.5 px-4">Availability</th>
                  <th className="py-3.5 px-4 text-right">Storefront</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100"}
                          alt={p.name}
                          className="w-11 h-11 object-contain rounded-xl bg-slate-50 p-1 border border-slate-200 shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-xs text-xs">
                            {p.name}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {p.unitValue || 1} {p.unit || "pack"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {p.category?.name || "Grocery"}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">
                        ₹{p.discountPrice || p.price}
                        {p.discountPrice && p.discountPrice < p.price && (
                          <span className="text-[10px] text-slate-400 line-through block font-normal">
                            ₹{p.price}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-mono font-bold ${
                          p.stock <= 5 ? "text-red-600" : "text-slate-800"
                        }`}
                      >
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStock(p.id, p.isAvailable)}
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer transition-colors ${
                          p.isAvailable
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-red-100 text-red-800 hover:bg-red-200"
                        }`}
                      >
                        {p.isAvailable ? "In Stock" : "Out of Stock"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/product/${p.id}`}
                        target="_blank"
                        className="text-xs text-indigo-600 hover:underline font-bold"
                      >
                        View Item →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          BULK IMPORT MODAL (EXCEL / CSV)
      ===================================================== */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Bulk Product & Category Import (Excel / CSV)
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setParsedProducts([]);
                  setBulkFile(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Quickly import entire product lines and categories at once using a CSV or Excel spreadsheet.
            </p>

            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
            >
              <Upload className="w-8 h-8 text-indigo-600 mx-auto" />
              <p className="text-xs font-bold text-slate-800">
                {bulkFile ? bulkFile.name : "Click to select Excel (.xlsx, .xls) or CSV spreadsheet"}
              </p>
              <p className="text-[11px] text-slate-500">
                Required columns: <strong>Name, Category, Price, Stock</strong> (Optional: Discount Price, Unit, Description, Image URL - Supports 100+ items)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                onChange={handleBulkFileChange}
                className="hidden"
              />
            </div>

            {/* Preview of Parsed Products */}
            {parsedProducts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="text-emerald-700 flex items-center gap-1.5 font-bold">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Detected {parsedProducts.length} products ready for import:
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs bg-slate-50/50">
                  {parsedProducts.slice(0, 50).map((p, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-white transition-colors">
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-900 truncate block">{idx + 1}. {p.name}</span>
                        <span className="text-[10px] text-slate-500">
                          {p.category} • ₹{p.price} {p.discountPrice ? `(Sale: ₹${p.discountPrice})` : ""}
                        </span>
                      </div>
                      <div className="font-mono font-bold text-indigo-700 shrink-0 text-right">
                        {p.stock} {p.unit}
                      </div>
                    </div>
                  ))}
                  {parsedProducts.length > 50 && (
                    <div className="p-2.5 text-center text-[11px] text-slate-500 bg-slate-100/70 font-semibold">
                      +{parsedProducts.length - 50} more products included in import...
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadSampleTemplate}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Sample Template
                </button>
                <button
                  type="button"
                  onClick={downloadProductDetails}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Export All ({products.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyBulkImport}
                  disabled={uploadingBulk || parsedProducts.length === 0}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {uploadingBulk ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>Import All ({parsedProducts.length}) Products</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          ADD SINGLE PRODUCT MODAL
      ===================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Add New Grocery Product</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Organic Tomatoes"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden focus:bg-white focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category *</label>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock Count *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional sale price"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-hidden"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unit</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-hidden"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="ml">ml</option>
                    <option value="pack">pack</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
              </div>

              {/* Product Image Option: File or URL */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Product Image</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Option A: Upload Image File</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setImageFile(file);
                          setImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">Option B: Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={formData.image}
                      onChange={(e) => {
                        setFormData({ ...formData, image: e.target.value });
                        if (e.target.value) setImagePreview(e.target.value);
                      }}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 outline-hidden text-xs"
                    />
                  </div>
                </div>

                {imagePreview && (
                  <div className="flex items-center gap-2 pt-1">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-12 h-12 object-contain rounded-xl border border-slate-200 bg-slate-50 p-1"
                    />
                    <span className="text-[11px] text-emerald-600 font-semibold">Image selected for upload</span>
                  </div>
                )}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Fresh farm produce description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
