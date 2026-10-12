import * as XLSX from "xlsx";

/**
 * Robust Spreadsheet (Excel .xlsx/.xls and CSV) Parser for Ruchi Store
 * Handles:
 * - .xlsx, .xls, .csv, .tsv, .txt
 * - Automatic detection of header row
 * - Flexible header name matching (Name, MRP, Rate, Category, Stock, Qty, etc.)
 * - Currency cleaning (₹, $, Rs, commas)
 * - Safe numeric conversions
 */

// Helper to sanitize strings
const cleanStr = (val) => {
  if (val === null || val === undefined) return "";
  return String(val).trim();
};

// Helper to sanitize numeric values including currency symbols and commas
export const parseCleanNumber = (val) => {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return isNaN(val) ? null : val;
  const str = String(val)
    .replace(/[₹$,]/g, "")
    .replace(/[^\d.-]/g, "")
    .trim();
  if (!str) return null;
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
};

/**
 * Parse any uploaded file (.xlsx, .xls, .csv) into raw 2D array of rows
 */
export const readSpreadsheetRows = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
};

/**
 * Detect the header row index and map column indices flexibly
 */
const detectHeaders = (rawRows) => {
  let headerRowIdx = 0;
  let maxScore = -1;

  const keywords = [
    "name", "product", "item", "title",
    "price", "mrp", "rate", "cost",
    "stock", "qty", "quantity", "count",
    "category", "cat", "sku", "unit"
  ];

  // Scan first 10 rows to find the actual header row
  const scanLimit = Math.min(10, rawRows.length);
  for (let r = 0; r < scanLimit; r++) {
    const row = rawRows[r];
    if (!Array.isArray(row)) continue;
    let score = 0;
    row.forEach((cell) => {
      const cellText = cleanStr(cell).toLowerCase();
      if (keywords.some((k) => cellText.includes(k))) {
        score++;
      }
    });
    if (score > maxScore) {
      maxScore = score;
      headerRowIdx = r;
    }
  }

  const rawHeaders = (rawRows[headerRowIdx] || []).map((h) => cleanStr(h).toLowerCase());

  const findIdx = (predicate) => rawHeaders.findIndex(predicate);

  const nameIdx = findIdx(
    (h) => (h.includes("name") || h.includes("product") || h.includes("item") || h.includes("title")) && !h.includes("category")
  );
  const catIdx = findIdx(
    (h) => h.includes("cat") || h.includes("dept") || h.includes("department") || h.includes("group") || h.includes("type")
  );
  const priceIdx = findIdx(
    (h) => (h.includes("price") || h.includes("mrp") || h.includes("rate") || h.includes("cost") || h.includes("selling")) && !h.includes("discount") && !h.includes("sale") && !h.includes("offer")
  );
  const discIdx = findIdx(
    (h) => h.includes("discount") || h.includes("sale") || h.includes("offer") || h.includes("special")
  );
  const stockIdx = findIdx(
    (h) => (h.includes("stock") || h.includes("qty") || h.includes("quantity") || h.includes("count") || h.includes("available") || h.includes("units")) && !h.includes("delta") && !h.includes("change")
  );
  const deltaIdx = findIdx(
    (h) => h.includes("delta") || h.includes("change") || h.includes("add") || h.includes("restock")
  );
  const unitIdx = findIdx(
    (h) => (h.includes("unit") || h.includes("uom") || h.includes("measure")) && !h.includes("value")
  );
  const valIdx = findIdx(
    (h) => h.includes("unit value") || h.includes("value") || h.includes("weight") || h.includes("volume") || h.includes("size") || h.includes("pack size")
  );
  const descIdx = findIdx(
    (h) => h.includes("desc") || h.includes("about") || h.includes("detail")
  );
  const imgIdx = findIdx(
    (h) => h.includes("image") || h.includes("photo") || h.includes("picture") || h.includes("url") || h.includes("link")
  );
  const skuIdx = findIdx(
    (h) => h.includes("sku") || h.includes("barcode") || h.includes("code") || h.includes("item id")
  );

  return {
    headerRowIdx,
    rawHeaders,
    indices: {
      nameIdx: nameIdx !== -1 ? nameIdx : 0,
      catIdx,
      priceIdx,
      discIdx,
      stockIdx,
      deltaIdx,
      unitIdx,
      valIdx,
      descIdx,
      imgIdx,
      skuIdx,
    },
  };
};

/**
 * Parse products catalogue spreadsheet (supports 100+ items)
 */
export const parseProductsCatalogueFile = async (file) => {
  const rawRows = await readSpreadsheetRows(file);
  if (!rawRows || rawRows.length < 2) {
    throw new Error("Spreadsheet appears to be empty or has no data rows");
  }

  const { headerRowIdx, indices } = detectHeaders(rawRows);
  const { nameIdx, catIdx, priceIdx, discIdx, stockIdx, unitIdx, valIdx, descIdx, imgIdx, skuIdx } = indices;

  const products = [];

  for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || !Array.isArray(row)) continue;

    // Check if entire row is empty
    const hasAnyValue = row.some((c) => cleanStr(c).length > 0);
    if (!hasAnyValue) continue;

    const name = cleanStr(row[nameIdx] || (skuIdx !== -1 ? row[skuIdx] : row[0]));
    if (!name) continue;

    const category = catIdx !== -1 && cleanStr(row[catIdx]) ? cleanStr(row[catIdx]) : "Grocery";
    const rawPrice = priceIdx !== -1 ? parseCleanNumber(row[priceIdx]) : null;
    const price = rawPrice !== null && rawPrice > 0 ? rawPrice : 50; // Fallback price so products aren't discarded

    const rawDiscount = discIdx !== -1 ? parseCleanNumber(row[discIdx]) : null;
    const discountPrice = rawDiscount !== null && rawDiscount > 0 ? rawDiscount : null;

    const rawStock = stockIdx !== -1 ? parseCleanNumber(row[stockIdx]) : null;
    const stock = rawStock !== null && !isNaN(rawStock) ? Math.max(0, Math.round(rawStock)) : 50;

    const unit = unitIdx !== -1 && cleanStr(row[unitIdx]) ? cleanStr(row[unitIdx]) : "pack";
    const unitValue = valIdx !== -1 && cleanStr(row[valIdx]) ? cleanStr(row[valIdx]) : "1";
    const description = descIdx !== -1 ? cleanStr(row[descIdx]) : "";
    const image = imgIdx !== -1 ? cleanStr(row[imgIdx]) : "";
    const sku = skuIdx !== -1 && cleanStr(row[skuIdx]) ? cleanStr(row[skuIdx]) : null;

    products.push({
      name,
      category,
      price,
      discountPrice,
      stock,
      unit,
      unitValue,
      description,
      image,
      sku,
    });
  }

  return products;
};

/**
 * Parse inventory stock spreadsheet (supports 100+ items)
 */
export const parseInventoryStockFile = async (file) => {
  const rawRows = await readSpreadsheetRows(file);
  if (!rawRows || rawRows.length < 2) {
    throw new Error("Spreadsheet appears to be empty or has no data rows");
  }

  const { headerRowIdx, indices } = detectHeaders(rawRows);
  const { nameIdx, skuIdx, stockIdx, deltaIdx, catIdx, priceIdx, unitIdx, valIdx } = indices;

  const rows = [];

  for (let i = headerRowIdx + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || !Array.isArray(row)) continue;

    const hasAnyValue = row.some((c) => cleanStr(c).length > 0);
    if (!hasAnyValue) continue;

    const name = cleanStr(row[nameIdx] || (skuIdx !== -1 ? row[skuIdx] : row[0]));
    if (!name) continue;

    const sku = skuIdx !== -1 && cleanStr(row[skuIdx]) ? cleanStr(row[skuIdx]) : null;
    const rawStock = stockIdx !== -1 ? parseCleanNumber(row[stockIdx]) : null;
    const stock = rawStock !== null && !isNaN(rawStock) ? Math.max(0, Math.round(rawStock)) : null;

    const rawDelta = deltaIdx !== -1 ? parseCleanNumber(row[deltaIdx]) : null;
    const quantityDelta = rawDelta !== null && !isNaN(rawDelta) ? Math.round(rawDelta) : null;

    const category = catIdx !== -1 && cleanStr(row[catIdx]) ? cleanStr(row[catIdx]) : "Grocery";
    const rawPrice = priceIdx !== -1 ? parseCleanNumber(row[priceIdx]) : null;
    const price = rawPrice !== null && rawPrice > 0 ? rawPrice : 50;
    const unit = unitIdx !== -1 && cleanStr(row[unitIdx]) ? cleanStr(row[unitIdx]) : "pack";
    const unitValue = valIdx !== -1 && cleanStr(row[valIdx]) ? cleanStr(row[valIdx]) : "1";

    rows.push({
      name,
      sku: sku || undefined,
      stock: stock !== null ? stock : undefined,
      quantityDelta: quantityDelta !== null ? quantityDelta : undefined,
      category,
      price,
      unit,
      unitValue,
    });
  }

  return rows;
};

/**
 * Export rows to .xlsx Excel Workbook
 */
export const exportToExcel = (filename, sheetName, dataRows) => {
  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName || "Sheet1");
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
};

/**
 * Export rows to CSV
 */
export const exportToCsv = (filename, csvString) => {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
