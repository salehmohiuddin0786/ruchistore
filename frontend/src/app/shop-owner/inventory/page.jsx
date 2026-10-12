"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Layers,
  AlertTriangle,
  Plus,
  Search,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  X,
  Image as ImageIcon,
  Edit3,
  Package,
} from "lucide-react";
import apiClient from "../../../api/apiClient";
import { useToast } from "../../../context/ToastContext";
import {
  parseInventoryStockFile,
  exportToExcel,
  exportToCsv,
} from "../../../utils/spreadsheetParser";

export default function ShopOwnerInventoryPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [adjustingId, setAdjustingId] = useState(null);

  // Bulk Upload Modal State
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const fileInputRef = useRef(null);

  // Single Item Edit/Image Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editStockValue, setEditStockValue] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/shop-owner/inventory");
      if (res.data?.success) {
        setProducts(res.data.data?.products || res.data.data?.inventory || []);
      }
    } catch (err) {
      console.error("Failed to load inventory", err);
      showToast("Could not load inventory", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (productId, delta) => {
    try {
      setAdjustingId(productId);
      const res = await apiClient.put(`/shop-owner/inventory/${productId}`, {
        quantityDelta: delta,
        reason: "Shop quick restock",
      });
      if (res.data?.success) {
        showToast(`Stock updated (+${delta} units)`, "success");
        loadInventory();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update stock", "error");
    } finally {
      setAdjustingId(null);
    }
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setEditStockValue(item.stock?.toString() || "0");
    setEditImageUrl(item.image || "");
  };

  const handleSaveItemEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      setSavingEdit(true);
      const newStock = parseInt(editStockValue, 10);
      const res = await apiClient.put(`/shop-owner/inventory/${editingItem.id}`, {
        newStock: isNaN(newStock) ? editingItem.stock : newStock,
        image: editImageUrl.trim() || undefined,
        reason: "Manual item adjustment",
      });
      if (res.data?.success) {
        showToast("Stock and details updated successfully!", "success");
        setEditingItem(null);
        loadInventory();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update item", "error");
    } finally {
      setSavingEdit(false);
    }
  };

  /* =========================================================
     CSV / EXCEL PARSER & TEMPLATES
  ========================================================= */

  const downloadSampleTemplate = () => {
    let templateRows = [["Item Name", "Stock Quantity", "Category", "Price", "SKU"]];

    if (products.length > 0) {
      products.forEach((p) => {
        templateRows.push([
          p.name || "",
          p.stock || 50,
          p.category?.name || p.category || "Grocery",
          p.price || 50,
          p.sku || "",
        ]);
      });
    } else {
      templateRows = templateRows.concat([
        ["Fresh Organic Tomatoes", 100, "Vegetables", 45, "SKU-TOM-100"],
        ["Shimla Apples", 60, "Fruits", 140, "SKU-APP-100"],
        ["Amul Taaza Milk", 80, "Dairy", 30, "SKU-MILK-100"],
        ["Aashirvaad Whole Wheat Atta", 40, "Staples", 260, "SKU-ATTA-100"],
        ["Lay's Classic Salted Potato Chips", 150, "Snacks", 20, "SKU-LAYS-100"],
        ["Tata Tea Gold", 75, "Beverages", 160, "SKU-TEA-100"],
        ["Fortune Sunlite Sunflower Oil", 90, "Staples", 135, "SKU-OIL-100"],
        ["Dettol Original Liquid Soap", 120, "Personal Care", 99, "SKU-DET-100"],
        ["Surf Excel Easy Wash Detergent", 65, "Household", 145, "SKU-SURF-100"],
        ["Cadbury Dairy Milk Silk", 200, "Snacks", 80, "SKU-CAD-100"],
      ]);
    }

    try {
      exportToExcel("ruchi_store_inventory_stock_template.xlsx", "Stock Template", templateRows);
      showToast("Excel (.xlsx) stock template downloaded!", "success");
    } catch {
      const csvStr = templateRows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      exportToCsv("ruchi_store_inventory_stock_template.csv", csvStr);
      showToast("CSV stock template downloaded!", "info");
    }
  };

  const downloadCurrentStockDetails = () => {
    if (!products || products.length === 0) {
      showToast("No products in inventory to download", "error");
      return;
    }
    const headers = ["Item Name", "Stock Quantity", "Category", "Price", "Status", "SKU"];
    const rows = [headers];

    products.forEach((p) => {
      const status = p.stock <= 0 ? "Out of Stock" : (p.stock <= (p.threshold || 5) ? "Low Stock" : "In Stock");
      rows.push([
        p.name || "",
        p.stock || 0,
        p.category?.name || p.category || "Grocery",
        p.price || 0,
        status,
        p.sku || "",
      ]);
    });

    try {
      exportToExcel(`store_inventory_stock_${new Date().toISOString().slice(0, 10)}.xlsx`, "Stock", rows);
      showToast(`Exported ${products.length} inventory items to Excel (.xlsx)!`, "success");
    } catch {
      const csvStr = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      exportToCsv(`store_inventory_stock_${new Date().toISOString().slice(0, 10)}.csv`, csvStr);
      showToast(`Exported ${products.length} inventory items to CSV!`, "success");
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFile(file);
    try {
      setUploadingBulk(true);
      const parsed = await parseInventoryStockFile(file);
      if (!parsed || parsed.length === 0) {
        showToast("No valid inventory rows found in file", "error");
        setParsedRows([]);
      } else {
        setParsedRows(parsed);
        showToast(`Successfully parsed all ${parsed.length} items from ${file.name}!`, "success");
      }
    } catch (err) {
      console.error("Bulk file parse error:", err);
      showToast(err.message || "Failed to parse inventory file", "error");
      setParsedRows([]);
    } finally {
      setUploadingBulk(false);
    }
  };

  const handleApplyBulkUpload = async () => {
    if (parsedRows.length === 0) {
      showToast("No valid inventory rows found in file", "error");
      return;
    }

    try {
      setUploadingBulk(true);
      const res = await apiClient.post("/shop-owner/inventory/bulk-update", {
        items: parsedRows,
      });

      if (res.data?.success) {
        showToast(res.data.message || `Successfully updated stock for all items!`, "success");
        setShowBulkModal(false);
        setBulkFile(null);
        setParsedRows([]);
        loadInventory();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to upload stock file", "error");
    } finally {
      setUploadingBulk(false);
    }
  };

  /* =========================================================
     FILTERING & METRICS
  ========================================================= */

  const filtered = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = products.filter((p) => p.stock <= (p.threshold || 10));
  const totalStockUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inventory & Stock Management
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Atomic live stock ledger, batch restock imports, and real-time inventory alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, SKU, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 outline-hidden focus:border-purple-600 focus:ring-1 focus:ring-purple-600 shadow-2xs"
            />
          </div>

          <button
            onClick={downloadCurrentStockDetails}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Download full inventory stock list as CSV"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Download Stock Details</span>
          </button>

          <button
            onClick={downloadSampleTemplate}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Download blank sample template format"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Sample CSV</span>
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk Upload (CSV)</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Total Tracked Items
          </span>
          <p className="text-2xl font-black text-slate-900">{products.length}</p>
          <span className="text-[11px] text-slate-500">Products in warehouse</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-amber-200 shadow-2xs bg-amber-50/20">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Low Stock Items
          </span>
          <p className="text-2xl font-black text-amber-700">{lowStockItems.length}</p>
          <span className="text-[11px] text-amber-800 font-semibold">Requires immediate restock</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-emerald-200 shadow-2xs bg-emerald-50/20">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Adequate Stock
          </span>
          <p className="text-2xl font-black text-emerald-700">
            {Math.max(0, products.length - lowStockItems.length)}
          </p>
          <span className="text-[11px] text-emerald-800 font-semibold">Ready for dispatch</span>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
            Total Inventory Units
          </span>
          <p className="text-2xl font-black text-purple-700">{totalStockUnits}</p>
          <span className="text-[11px] text-slate-500">Total units available</span>
        </div>
      </div>

      {/* Inventory Table Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 p-8 space-y-3">
            <Layers className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No inventory records found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search
                ? `No products match your search query '${search}'.`
                : "Add products or upload an Excel/CSV file to manage stock."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Item & SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Selling Price</th>
                  <th className="py-3.5 px-4">Current Stock</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Quick Restock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((item) => {
                  const isOut = item.stock <= 0;
                  const isLow = !isOut && item.stock <= (item.threshold || 10);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Product Image & Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100"}
                            alt={item.name}
                            className="w-11 h-11 object-contain rounded-xl bg-slate-50 p-1 border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block text-xs leading-tight">
                              {item.name}
                            </span>
                            <span className="text-[11px] font-mono font-medium text-slate-500">
                              {item.sku || `SKU-${item.id}`} • {item.unitValue || 1} {item.unit || "pack"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-700">
                          {item.category?.name || "Grocery"}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">
                          ₹{item.discountPrice || item.price}
                          {item.discountPrice && item.discountPrice < item.price && (
                            <span className="text-[10px] text-slate-400 line-through block font-normal">
                              ₹{item.price}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock Count */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-sm text-slate-900 block">
                          {item.stock} {item.unit || "units"}
                        </span>
                        {item.reserved > 0 && (
                          <span className="text-[10px] text-amber-700 font-semibold">
                            ({item.reserved} reserved)
                          </span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-red-100 text-red-800 border border-red-200 px-2.5 py-0.5 rounded-md">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-md">
                            <AlertTriangle className="w-3 h-3 text-amber-600" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                            Adequate
                          </span>
                        )}
                      </td>

                      {/* Quick Restock Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAdjustStock(item.id, 10)}
                            disabled={adjustingId === item.id}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200 transition-colors cursor-pointer text-xs"
                            title="Add 10 units"
                          >
                            +10
                          </button>
                          <button
                            onClick={() => handleAdjustStock(item.id, 50)}
                            disabled={adjustingId === item.id}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold transition-colors cursor-pointer text-xs"
                            title="Add 50 units"
                          >
                            +50
                          </button>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                            title="Edit exact stock / image"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          BULK UPLOAD MODAL (CSV / EXCEL)
      ===================================================== */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-purple-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Bulk Stock Update (Excel / CSV)
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setParsedRows([]);
                  setBulkFile(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Upload a CSV or Excel spreadsheet containing your <strong>Item Name</strong> and the updated <strong>Stock Quantity</strong>. No SKU code is required!
            </p>

            {/* Upload Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/40 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2"
            >
              <Upload className="w-8 h-8 text-purple-600 mx-auto" />
              <p className="text-xs font-bold text-slate-800">
                {bulkFile ? bulkFile.name : "Click to select Excel (.xlsx, .xls) or CSV spreadsheet"}
              </p>
              <p className="text-[11px] text-slate-500">
                Supports Excel (.xlsx, .xls) & .csv with columns: <strong>Item Name, Stock Quantity</strong> (Supports 100+ items)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Parsed Rows Preview */}
            {parsedRows.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="text-emerald-700 flex items-center gap-1.5 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Detected {parsedRows.length} items ready for stock update:
                  </span>
                </div>

                <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 text-xs bg-slate-50/50">
                  {parsedRows.slice(0, 50).map((r, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between hover:bg-white transition-colors">
                      <div className="min-w-0 pr-2">
                        <span className="font-bold text-slate-900 truncate block">{idx + 1}. {r.name}</span>
                        {r.sku && <span className="text-[10px] text-slate-400 font-mono">{r.sku}</span>}
                      </div>
                      <div className="font-mono font-bold text-purple-700 shrink-0 text-right">
                        {r.stock !== undefined ? `${r.stock} units` : `+${r.quantityDelta} units`}
                      </div>
                    </div>
                  ))}
                  {parsedRows.length > 50 && (
                    <div className="p-2.5 text-center text-[11px] text-slate-500 bg-slate-100/70 font-semibold">
                      +{parsedRows.length - 50} more items included in update...
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
                  className="text-xs text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Sample Template
                </button>
                <button
                  type="button"
                  onClick={downloadCurrentStockDetails}
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
                  onClick={handleApplyBulkUpload}
                  disabled={uploadingBulk || parsedRows.length === 0}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {uploadingBulk ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>Apply Updates ({parsedRows.length})</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          SINGLE ITEM EDIT / IMAGE MODAL
      ===================================================== */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Update Stock & Details
              </h2>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <img
                src={editImageUrl || editingItem.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100"}
                alt={editingItem.name}
                className="w-12 h-12 object-contain rounded-xl bg-white p-1 border border-slate-200 shrink-0"
              />
              <div>
                <h3 className="font-bold text-slate-900 text-xs">{editingItem.name}</h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {editingItem.sku || `SKU-${editingItem.id}`} • {editingItem.unit || "pack"}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveItemEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Absolute Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editStockValue}
                  onChange={(e) => setEditStockValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-mono font-bold outline-hidden focus:bg-white focus:border-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Product Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 outline-hidden focus:bg-white focus:border-purple-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold disabled:opacity-50"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
