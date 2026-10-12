const { Op } = require("sequelize");
const {
  Shop,
  Product,
  Category,
  Order,
  OrderItem,
  OrderStatusHistory,
  Address,
  User,
  Inventory,
  InventoryTransaction,
  DeliveryPartner,
  DeliveryAssignment,
} = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");
const { ORDER_STATUSES, validateTransition } = require("../services/orderStateMachine");
const { releaseInventory } = require("../services/inventoryService");
const { assignNextDeliveryPartner } = require("../services/deliveryAssignment.service");
const { emitOrderEvent } = require("../sockets/socketHandler");
const { sequelize } = require("../config/db");
const { formatOrder } = require("./order.controller");

// Helper to get shop owned by user
const getOwnedShop = async (userId) => {
  const shop = await Shop.findOne({ where: { owner_id: userId } });
  if (!shop) {
    throw new AppError("No shop profile associated with this account", 404, "SHOP_NOT_FOUND");
  }
  return shop;
};

// Shop Dashboard Stats
const getDashboard = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Today's Orders (both newly created and delivered today)
  const todayOrders = await Order.findAll({
    where: {
      shop_id: shop.id,
      [Op.or]: [
        { created_at: { [Op.gte]: startOfDay } },
        { delivered_at: { [Op.gte]: startOfDay } },
        { updated_at: { [Op.gte]: startOfDay }, order_status: ORDER_STATUSES.DELIVERED },
      ],
    },
  });

  const todayRevenue = todayOrders
    .filter((o) => o.order_status !== ORDER_STATUSES.CANCELLED)
    .reduce((sum, o) => sum + parseFloat(o.subtotal || o.total_amount || 0), 0);

  // Pending orders requiring action
  const pendingOrders = await Order.findAll({
    where: {
      shop_id: shop.id,
      order_status: {
        [Op.in]: [ORDER_STATUSES.PLACED, ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.PACKING],
      },
    },
    include: [
      { model: OrderItem, as: "items" },
      { model: Address, as: "deliveryAddress" },
      { model: User, as: "customer", attributes: ["name", "phone"] },
      {
        model: DeliveryPartner,
        as: "deliveryPartner",
        include: [{ model: User, as: "user", attributes: ["id", "name", "phone", "email"] }],
      },
    ],
    order: [["created_at", "DESC"]],
  });

  // Low stock products
  const lowStockProducts = await Product.findAll({
    where: {
      shop_id: shop.id,
      is_available: true,
      stock_quantity: { [Op.lte]: sequelize.col("low_stock_threshold") },
    },
    limit: 10,
  });

  const totalProducts = await Product.count({ where: { shop_id: shop.id } });

  res.json({
    success: true,
    data: {
      shop: {
        id: shop.id,
        name: shop.name,
        isOpen: shop.is_open,
        status: shop.status,
        rating: shop.rating,
        commissionPercentage: shop.commission_percentage,
      },
      stats: {
        todaySales: Math.round(todayRevenue * 100) / 100,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        todayOrdersCount: todayOrders.length,
        todayOrders: todayOrders.length,
        pendingOrdersCount: pendingOrders.length,
        pendingToPack: pendingOrders.length,
        totalProducts,
        lowStockCount: lowStockProducts.length,
      },
      pendingOrders: pendingOrders.map(formatOrder),
      lowStockProducts,
    },
  });
});

// Get Shop Orders with Status Filter & Pagination
const getOrders = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  const { status, page = 1, limit = 20 } = req.query;

  const whereClause = { shop_id: shop.id };
  if (status) {
    whereClause.order_status = status;
  }

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereClause,
    include: [
      { model: OrderItem, as: "items" },
      { model: Address, as: "deliveryAddress" },
      { model: User, as: "customer", attributes: ["name", "phone"] },
      {
        model: DeliveryPartner,
        as: "deliveryPartner",
        include: [{ model: User, as: "user", attributes: ["id", "name", "phone", "email"] }],
      },
    ],
    limit: parseInt(limit, 10),
    offset,
    order: [["created_at", "DESC"]],
  });

  const formattedOrders = orders.map(formatOrder);

  res.json({
    success: true,
    data: { orders: formattedOrders },
    meta: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / limit),
    },
  });
});

// Update Order Status (Accept, Pack, Ready for Pickup, Reject)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  const { id } = req.params;
  const { status, reason } = req.body;

  const order = await Order.findOne({
    where: { id, shop_id: shop.id },
    include: [{ model: OrderItem, as: "items" }],
  });

  if (!order) {
    throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  }

  // Validate state machine
  const validation = validateTransition(order.order_status, status, "SHOP_OWNER");
  if (!validation.valid) {
    throw new AppError(validation.reason, 409, "INVALID_STATE_TRANSITION");
  }

  const transaction = await sequelize.transaction();

  try {
    const updateData = { order_status: status };

    if (status === ORDER_STATUSES.CONFIRMED) {
      updateData.accepted_at = new Date();
    } else if (status === ORDER_STATUSES.PACKING) {
      updateData.packed_at = new Date();
    } else if (status === ORDER_STATUSES.READY_FOR_PICKUP) {
      updateData.ready_at = new Date();
    } else if (status === ORDER_STATUSES.CANCELLED) {
      updateData.cancelled_at = new Date();
      updateData.cancellation_reason = reason || "Rejected by shop owner";
      // Release inventory
      await releaseInventory(order.items, order.id, shop.id, transaction);
    }

    await order.update(updateData, { transaction });

    await OrderStatusHistory.create(
      {
        order_id: order.id,
        status,
        changed_by_id: req.user.id,
        role: "SHOP_OWNER",
        note: reason || `Status updated to ${status} by shop owner`,
      },
      { transaction }
    );

    await transaction.commit();

    emitOrderEvent(`order:${status.toLowerCase()}`, order);

    // If marked READY_FOR_PICKUP, trigger delivery dispatch immediately
    if (status === ORDER_STATUSES.READY_FOR_PICKUP) {
      assignNextDeliveryPartner(order.id);
    }

    res.json({
      success: true,
      message: `Order marked as ${status}`,
      data: { order },
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// Products: Get all for shop
const getProducts = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  const { categoryId, search, page = 1, limit = 50 } = req.query;

  const whereClause = { shop_id: shop.id };
  if (categoryId) whereClause.category_id = categoryId;
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { sku: { [Op.like]: `%${search}%` } },
      { barcode: { [Op.like]: `%${search}%` } },
    ];
  }

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { count, rows: products } = await Product.findAndCountAll({
    where: whereClause,
    include: [{ model: Category, as: "category" }],
    limit: parseInt(limit, 10),
    offset,
    order: [["name", "ASC"]],
  });

  res.json({
    success: true,
    data: { products },
    meta: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / limit),
    },
  });
});

// Add Product
const createProduct = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  const {
    name,
    categoryId,
    description,
    price,
    discountPrice,
    unit = "pack",
    unitValue,
    stock = 0,
    lowStockThreshold = 5,
    sku,
    barcode,
    isAvailable = true,
    isFeatured = false,
    isBestseller = false,
  } = req.body;

  if (!name || !price || !categoryId) {
    throw new AppError("Name, price, and category are required", 400, "MISSING_FIELDS");
  }

  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}`;
  const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : req.body.image || null;

  const product = await Product.create({
    shop_id: shop.id,
    category_id: categoryId,
    name,
    slug,
    description,
    image: imageUrl,
    price: parseFloat(price),
    discount_price: discountPrice ? parseFloat(discountPrice) : null,
    unit,
    unit_value: unitValue,
    stock_quantity: parseInt(stock, 10) || 0,
    reserved_quantity: 0,
    low_stock_threshold: parseInt(lowStockThreshold, 10) || 5,
    sku,
    barcode,
    is_available: isAvailable,
    is_featured: isFeatured,
    is_bestseller: isBestseller,
  });

  await Inventory.create({
    product_id: product.id,
    shop_id: shop.id,
    stock_quantity: product.stock_quantity,
    reserved_quantity: 0,
    low_stock_threshold: product.low_stock_threshold,
  });

  res.status(201).json({
    success: true,
    message: "Product created successfully",
    data: { product },
  });
});

// Update Product
const updateProduct = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  const { id } = req.params;

  const product = await Product.findOne({ where: { id, shop_id: shop.id } });
  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  const {
    name,
    categoryId,
    description,
    price,
    discountPrice,
    unit,
    unitValue,
    stock,
    lowStockThreshold,
    sku,
    barcode,
    isAvailable,
    isFeatured,
    isBestseller,
  } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (categoryId !== undefined) updateData.category_id = categoryId;
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = parseFloat(price);
  if (discountPrice !== undefined) updateData.discount_price = discountPrice ? parseFloat(discountPrice) : null;
  if (unit !== undefined) updateData.unit = unit;
  if (unitValue !== undefined) updateData.unit_value = unitValue;
  if (lowStockThreshold !== undefined) updateData.low_stock_threshold = parseInt(lowStockThreshold, 10);
  if (sku !== undefined) updateData.sku = sku;
  if (barcode !== undefined) updateData.barcode = barcode;
  if (isAvailable !== undefined) updateData.is_available = isAvailable;
  if (isFeatured !== undefined) updateData.is_featured = isFeatured;
  if (isBestseller !== undefined) updateData.is_bestseller = isBestseller;

  if (stock !== undefined) {
    updateData.stock_quantity = parseInt(stock, 10);
    await Inventory.update(
      { stock_quantity: parseInt(stock, 10) },
      { where: { product_id: product.id, shop_id: shop.id } }
    );
  }

  if (req.file) {
    updateData.image = `/uploads/products/${req.file.filename}`;
  } else if (req.body.image) {
    updateData.image = req.body.image;
  }

  await product.update(updateData);

  res.json({
    success: true,
    message: "Product updated successfully",
    data: { product },
  });
});

// Delete Product
const deleteProduct = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  const { id } = req.params;

  const product = await Product.findOne({ where: { id, shop_id: shop.id } });
  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  await product.destroy();

  res.json({
    success: true,
    message: "Product deleted",
  });
});

// Inventory View & Bulk Stock Update
const getInventory = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);

  const products = await Product.findAll({
    where: { shop_id: shop.id },
    attributes: [
      "id",
      "name",
      "sku",
      "image",
      "unit",
      "unit_value",
      "price",
      "discount_price",
      "stock_quantity",
      "reserved_quantity",
      "low_stock_threshold",
      "is_available",
      "category_id",
    ],
    include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
    order: [["stock_quantity", "ASC"]],
  });

  const formattedInventory = products.map((p) => {
    const plain = p.toJSON ? p.toJSON() : { ...p };
    return {
      id: plain.id,
      name: plain.name,
      sku: plain.sku,
      image: plain.image || null,
      unit: plain.unit || "pack",
      unitValue: plain.unit_value || 1,
      price: Number(plain.price || 0),
      discountPrice: plain.discount_price ? Number(plain.discount_price) : null,
      category: plain.category || { id: plain.category_id, name: "Grocery" },
      stock: plain.stock_quantity,
      reserved: plain.reserved_quantity,
      available: Math.max(0, plain.stock_quantity - plain.reserved_quantity),
      threshold: plain.low_stock_threshold,
      isLowStock: plain.stock_quantity <= plain.low_stock_threshold,
      isAvailable: plain.is_available,
    };
  });

  res.json({
    success: true,
    data: {
      inventory: formattedInventory,
      products: formattedInventory,
    },
  });
});

// Bulk Stock Update from CSV/Excel
const bulkUpdateStock = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("No items provided for bulk update", 400);
  }

  let updatedCount = 0;
  for (const item of items) {
    let product;
    if (item.id) {
      product = await Product.findOne({ where: { id: item.id, shop_id: shop.id } });
    }
    if (!product && item.name) {
      const cleanName = String(item.name).trim();
      product = await Product.findOne({ where: { name: cleanName, shop_id: shop.id } });
      if (!product) {
        product = await Product.findOne({
          where: {
            shop_id: shop.id,
            name: { [Op.like]: `%${cleanName}%` },
          },
        });
      }
    }
    if (!product && item.sku) {
      product = await Product.findOne({ where: { sku: String(item.sku).trim(), shop_id: shop.id } });
    }

    if (!product) continue;

    const prevStock = product.stock_quantity;
    let newStock = prevStock;

    if (item.stock !== undefined && item.stock !== null && item.stock !== "") {
      newStock = Math.max(0, parseInt(item.stock, 10));
    } else if (item.quantityDelta !== undefined && item.quantityDelta !== null && item.quantityDelta !== "") {
      newStock = Math.max(0, prevStock + parseInt(item.quantityDelta, 10));
    }

    const updateFields = {
      stock_quantity: newStock,
      is_available: newStock > 0,
    };
    if (item.image) {
      updateFields.image = item.image;
    }

    await product.update(updateFields);

    await Inventory.update(
      { stock_quantity: newStock },
      { where: { product_id: product.id, shop_id: shop.id } }
    );

    await InventoryTransaction.create({
      product_id: product.id,
      shop_id: shop.id,
      type: newStock >= prevStock ? "RESTOCKED" : "ADJUSTED",
      quantity: Math.abs(newStock - prevStock),
      balance_after: Math.max(0, newStock - product.reserved_quantity),
      notes: item.notes || "Bulk Excel/CSV upload",
    });

    updatedCount++;
  }

  res.json({
    success: true,
    message: `Updated stock for ${updatedCount} items`,
    data: { updatedCount },
  });
});

// Bulk Import Products & Categories from CSV/Excel
const bulkImportProducts = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  const items = req.body.products || req.body.items || req.body;

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError("No products provided for bulk import", 400);
  }

  const allCategories = await Category.findAll();
  const categoryMap = new Map();
  for (const cat of allCategories) {
    categoryMap.set(cat.name.toLowerCase().trim(), cat.id);
    categoryMap.set(String(cat.id), cat.id);
  }

  let importedCount = 0;
  let updatedCount = 0;

  for (const item of items) {
    const name = (item.name || item.productName || "").trim();
    if (!name) continue;

    // Resolve or auto-create category
    let categoryId = null;
    const catInput = (item.category || item.categoryName || item.categoryId || "Groceries").toString().trim();
    const catKey = catInput.toLowerCase();

    if (categoryMap.has(catKey)) {
      categoryId = categoryMap.get(catKey);
    } else {
      const slug = catKey.replace(/[^a-z0-9]+/g, "-");
      const newCat = await Category.create({
        name: catInput,
        slug: `${slug}-${Date.now().toString().slice(-4)}`,
        is_active: true,
      });
      categoryId = newCat.id;
      categoryMap.set(catKey, newCat.id);
      categoryMap.set(String(newCat.id), newCat.id);
    }

    const price = parseFloat(item.price || item.mrp || 0);
    if (!price || isNaN(price)) continue;

    const discountPrice = item.discountPrice || item.salePrice ? parseFloat(item.discountPrice || item.salePrice) : null;
    const stock = parseInt(item.stock || item.stockQuantity || item.quantity || 50, 10);
    const unit = item.unit || "pack";
    const unitValue = item.unitValue || "1";
    const description = item.description || "";
    const image = item.image || item.imageUrl || null;
    const sku = item.sku || `SKU-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    let existingProduct = null;
    if (item.id) {
      existingProduct = await Product.findOne({ where: { id: item.id, shop_id: shop.id } });
    }
    if (!existingProduct && item.sku) {
      existingProduct = await Product.findOne({ where: { sku: item.sku, shop_id: shop.id } });
    }
    if (!existingProduct) {
      existingProduct = await Product.findOne({ where: { name, shop_id: shop.id } });
    }

    if (existingProduct) {
      await existingProduct.update({
        category_id: categoryId,
        price,
        discount_price: discountPrice,
        unit,
        unit_value: unitValue,
        description: description || existingProduct.description,
        image: image || existingProduct.image,
        stock_quantity: stock,
        is_available: stock > 0,
      });
      await Inventory.update(
        { stock_quantity: stock },
        { where: { product_id: existingProduct.id, shop_id: shop.id } }
      );
      updatedCount++;
    } else {
      const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`;
      const newProduct = await Product.create({
        shop_id: shop.id,
        category_id: categoryId,
        name,
        slug,
        description,
        image,
        price,
        discount_price: discountPrice,
        unit,
        unit_value: unitValue,
        stock_quantity: stock,
        reserved_quantity: 0,
        low_stock_threshold: 5,
        sku,
        is_available: stock > 0,
      });
      await Inventory.create({
        product_id: newProduct.id,
        shop_id: shop.id,
        stock_quantity: stock,
        reserved_quantity: 0,
        low_stock_threshold: 5,
      });
      importedCount++;
    }
  }

  res.json({
    success: true,
    message: `Import complete: ${importedCount} created, ${updatedCount} updated`,
    data: { importedCount, updatedCount },
  });
});

// Update stock quantity for a single product
const updateStock = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  const { productId, newStock, notes = "Manual restock" } = req.body;

  const product = await Product.findOne({ where: { id: productId, shop_id: shop.id } });
  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  const parsedStock = parseInt(newStock, 10);
  const prevStock = product.stock_quantity;
  await product.update({ stock_quantity: parsedStock });

  await Inventory.update(
    { stock_quantity: parsedStock },
    { where: { product_id: product.id, shop_id: shop.id } }
  );

  await InventoryTransaction.create({
    product_id: product.id,
    shop_id: shop.id,
    type: parsedStock > prevStock ? "RESTOCKED" : "ADJUSTED",
    quantity: Math.abs(parsedStock - prevStock),
    balance_after: parsedStock - product.reserved_quantity,
    notes,
  });

  res.json({
    success: true,
    message: "Stock updated successfully",
    data: {
      productId: product.id,
      stock: parsedStock,
      available: Math.max(0, parsedStock - product.reserved_quantity),
    },
  });
});

// Get Shop Settings
const getShopSettings = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  res.json({
    success: true,
    data: { shop },
  });
});

// Update Shop Settings
const updateShopSettings = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  const {
    name,
    description,
    phone,
    email,
    address,
    city,
    state,
    pincode,
    openingTime,
    opening_time,
    closingTime,
    closing_time,
    minimumOrder,
    minimum_order,
    minOrderAmount,
    estimatedDeliveryTime,
    estimated_delivery_time,
    isOpen,
    is_open,
    bannerImage,
    cover_image,
    logo,
    gstNumber,
    gst_number,
    panNumber,
    pan_number,
  } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (phone !== undefined) updateData.phone = phone;
  if (email !== undefined) updateData.email = email;
  if (address !== undefined) updateData.address = address;
  if (city !== undefined) updateData.city = city;
  if (state !== undefined) updateData.state = state;
  if (pincode !== undefined) updateData.pincode = pincode;

  const resolvedOpenTime = openingTime ?? opening_time;
  if (resolvedOpenTime !== undefined) updateData.opening_time = resolvedOpenTime;

  const resolvedCloseTime = closingTime ?? closing_time;
  if (resolvedCloseTime !== undefined) updateData.closing_time = resolvedCloseTime;

  const resolvedMinOrder = minimumOrder ?? minimum_order ?? minOrderAmount;
  if (resolvedMinOrder !== undefined) updateData.minimum_order = parseFloat(resolvedMinOrder) || 0.0;

  const resolvedDeliveryTime = estimatedDeliveryTime ?? estimated_delivery_time;
  if (resolvedDeliveryTime !== undefined) updateData.estimated_delivery_time = resolvedDeliveryTime;

  const resolvedIsOpen = isOpen ?? is_open;
  if (resolvedIsOpen !== undefined) updateData.is_open = Boolean(resolvedIsOpen);

  const resolvedBanner = bannerImage ?? cover_image;
  if (resolvedBanner !== undefined) updateData.cover_image = resolvedBanner;

  if (logo !== undefined) updateData.logo = logo;

  const resolvedGst = gstNumber ?? gst_number;
  if (resolvedGst !== undefined) updateData.gst_number = resolvedGst;

  const resolvedPan = panNumber ?? pan_number;
  if (resolvedPan !== undefined) updateData.pan_number = resolvedPan;

  if (req.files) {
    if (req.files.logo) updateData.logo = `/uploads/shops/${req.files.logo[0].filename}`;
    if (req.files.coverImage) updateData.cover_image = `/uploads/shops/${req.files.coverImage[0].filename}`;
  }

  await shop.update(updateData);

  res.json({
    success: true,
    message: "Shop settings updated successfully",
    data: { shop },
  });
});

// Shop Earnings breakdown (Genuine Calculation per Shop)
const getEarnings = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);

  const allCompletedOrders = await Order.findAll({
    where: {
      shop_id: shop.id,
      order_status: ORDER_STATUSES.DELIVERED,
    },
    include: [
      { model: OrderItem, as: "items" },
      { model: User, as: "customer", attributes: ["name", "phone"] },
    ],
    order: [["delivered_at", "DESC"], ["created_at", "DESC"]],
  });

  const allActiveOrders = await Order.findAll({
    where: {
      shop_id: shop.id,
      order_status: {
        [Op.in]: [
          ORDER_STATUSES.PLACED,
          ORDER_STATUSES.CONFIRMED,
          ORDER_STATUSES.PACKING,
          ORDER_STATUSES.READY_FOR_PICKUP,
          ORDER_STATUSES.OUT_FOR_DELIVERY,
        ],
      },
    },
    attributes: ["id", "order_number", "subtotal", "total_amount", "order_status", "created_at"],
  });

  const grossSales = allCompletedOrders.reduce((sum, o) => {
    const val = parseFloat(o.subtotal ?? o.total_amount ?? 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const activeSales = allActiveOrders.reduce((sum, o) => {
    const val = parseFloat(o.subtotal ?? o.total_amount ?? 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const commissionRate = parseFloat(shop.commission_percentage || 10.0);
  const totalCommission = (grossSales * commissionRate) / 100;
  const netEarnings = grossSales - totalCommission;
  const netPayable = netEarnings;

  res.json({
    success: true,
    data: {
      shopName: shop.name,
      grossSales: Math.round(grossSales * 100) / 100,
      commissionRate,
      totalCommission: Math.round(totalCommission * 100) / 100,
      netEarnings: Math.round(netEarnings * 100) / 100,
      netPayable: Math.round(netPayable * 100) / 100,
      activeOrdersCount: allActiveOrders.length,
      activeSales: Math.round(activeSales * 100) / 100,
      deliveredOrdersCount: allCompletedOrders.length,
      orders: allCompletedOrders.slice(0, 50).map(formatOrder),
    },
  });
});

// Request Payout
const requestPayout = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  const { amount, upiId, bankAccountNumber } = req.body;

  const completedOrders = await Order.findAll({
    where: {
      shop_id: shop.id,
      order_status: ORDER_STATUSES.DELIVERED,
    },
    attributes: ["subtotal", "total_amount"],
  });

  const grossSales = completedOrders.reduce((sum, o) => sum + parseFloat(o.subtotal || o.total_amount || 0), 0);
  const commissionRate = parseFloat(shop.commission_percentage || 10.0);
  const totalCommission = (grossSales * commissionRate) / 100;
  const netEarnings = grossSales - totalCommission;

  if (netEarnings <= 0) {
    throw new AppError("No available payout balance. Completed sales balance must be greater than ₹0 to withdraw.", 400);
  }

  const requestedAmount = amount ? Math.min(parseFloat(amount), netEarnings) : netEarnings;
  const payoutRef = `PO-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

  res.json({
    success: true,
    message: `Payout request for ₹${requestedAmount.toFixed(2)} submitted successfully! Ref: ${payoutRef}`,
    data: {
      referenceId: payoutRef,
      amount: requestedAmount,
      payoutMethod: upiId ? `UPI: ${upiId}` : bankAccountNumber ? `Bank A/C: ***${String(bankAccountNumber).slice(-4)}` : "Registered Store Account",
      estimatedCreditTime: "24-48 business hours",
      status: "PROCESSING",
    },
  });
});

// Upload Shop Image (Banner or Logo)
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError("Please select an image file to upload", 400, "MISSING_FILE");
  }

  const relativePath = `/uploads/shops/${req.file.filename}`;
  res.json({
    success: true,
    message: "Image uploaded successfully",
    data: {
      url: relativePath,
      filename: req.file.filename,
    },
  });
});

// Update Shop Open/Closed Status
const updateShopStatus = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  const { isOpen } = req.body;
  const newStatus = isOpen !== undefined ? Boolean(isOpen) : !shop.is_open;
  await shop.update({ is_open: newStatus });
  res.json({
    success: true,
    message: newStatus ? "Store is now open for orders" : "Store is now closed",
    data: { isOpen: newStatus, shop },
  });
});

// Update stock by product ID in route params
const updateStockById = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  const { id } = req.params;
  const { quantityDelta, newStock, stock, reason = "Shop restock" } = req.body;

  const product = await Product.findOne({ where: { id, shop_id: shop.id } });
  if (!product) {
    throw new AppError("Product not found", 404, "PRODUCT_NOT_FOUND");
  }

  const prevStock = product.stock_quantity;
  let parsedStock;
  if (quantityDelta !== undefined) {
    parsedStock = Math.max(0, prevStock + parseInt(quantityDelta, 10));
  } else if (newStock !== undefined || stock !== undefined) {
    parsedStock = parseInt(newStock !== undefined ? newStock : stock, 10);
  } else {
    parsedStock = prevStock;
  }

  await product.update({ stock_quantity: parsedStock });

  await Inventory.update(
    { stock_quantity: parsedStock },
    { where: { product_id: product.id, shop_id: shop.id } }
  );

  await InventoryTransaction.create({
    product_id: product.id,
    shop_id: shop.id,
    type: parsedStock > prevStock ? "RESTOCKED" : "ADJUSTED",
    quantity: Math.abs(parsedStock - prevStock),
    balance_after: Math.max(0, parsedStock - product.reserved_quantity),
    notes: reason,
  });

  res.json({
    success: true,
    message: "Stock updated successfully",
    data: {
      productId: product.id,
      stock: parsedStock,
      available: Math.max(0, parsedStock - product.reserved_quantity),
    },
  });
});

// Get available delivery partners for shop
const getDeliveryPartners = asyncHandler(async (req, res) => {
  await getOwnedShop(req.user.id);

  const partners = await DeliveryPartner.findAll({
    where: {
      [Op.or]: [{ status: "APPROVED" }, { is_approved: true }],
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "name", "phone", "email", "profile_image"],
      },
    ],
    order: [
      ["is_online", "DESC"],
      ["rating", "DESC"],
    ],
  });

  const formatted = partners.map((p) => {
    const plain = p.toJSON();
    return {
      id: plain.id,
      name: plain.user?.name || "Delivery Partner",
      phone: plain.user?.phone || "",
      email: plain.user?.email || "",
      avatar: plain.user?.profile_image || null,
      vehicleType: plain.vehicle_type,
      vehicleNumber: plain.vehicle_number,
      isOnline: Boolean(plain.is_online),
      rating: Number(plain.rating || 5.0),
      totalDeliveries: Number(plain.total_deliveries || 0),
      currentLat: plain.current_lat,
      currentLng: plain.current_lng,
    };
  });

  res.json({
    success: true,
    data: { partners: formatted },
  });
});

// Assign delivery partner to order
const assignDeliveryPartner = asyncHandler(async (req, res) => {
  const shop = await getOwnedShop(req.user.id);
  const { id } = req.params;
  const { deliveryPartnerId } = req.body;

  if (!deliveryPartnerId) {
    throw new AppError("Delivery partner ID is required", 400, "MISSING_PARTNER_ID");
  }

  const order = await Order.findOne({
    where: { id, shop_id: shop.id },
    include: [
      { model: OrderItem, as: "items" },
      { model: Address, as: "deliveryAddress" },
      { model: User, as: "customer", attributes: ["name", "phone"] },
    ],
  });

  if (!order) {
    throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  }

  if (order.order_status === ORDER_STATUSES.DELIVERED || order.order_status === ORDER_STATUSES.CANCELLED) {
    throw new AppError("Cannot assign delivery partner to a completed or cancelled order", 400, "ORDER_CLOSED");
  }

  const partner = await DeliveryPartner.findByPk(deliveryPartnerId, {
    include: [{ model: User, as: "user", attributes: ["id", "name", "phone"] }],
  });

  if (!partner) {
    throw new AppError("Delivery partner not found", 404, "PARTNER_NOT_FOUND");
  }

  const transaction = await sequelize.transaction();

  try {
    const currentStatus = order.order_status;
    const newStatus = [
      ORDER_STATUSES.PLACED,
      ORDER_STATUSES.CONFIRMED,
      ORDER_STATUSES.PACKING,
      ORDER_STATUSES.READY_FOR_PICKUP,
    ].includes(currentStatus)
      ? ORDER_STATUSES.ASSIGNED
      : currentStatus;

    await order.update(
      {
        delivery_partner_id: partner.id,
        order_status: newStatus,
        assigned_at: new Date(),
      },
      { transaction }
    );

    // Create or update delivery assignment record
    const [assignment] = await DeliveryAssignment.findOrCreate({
      where: { order_id: order.id, delivery_partner_id: partner.id },
      defaults: {
        order_id: order.id,
        delivery_partner_id: partner.id,
        status: "ACCEPTED",
        offered_at: new Date(),
        accepted_at: new Date(),
      },
      transaction,
    });

    if (assignment.status !== "ACCEPTED") {
      await assignment.update({ status: "ACCEPTED", accepted_at: new Date() }, { transaction });
    }

    // Record order status history
    await OrderStatusHistory.create(
      {
        order_id: order.id,
        status: newStatus,
        changed_by_id: req.user.id,
        role: "SHOP_OWNER",
        note: `Store keeper assigned delivery partner: ${partner.user?.name || partner.id}`,
      },
      { transaction }
    );

    await transaction.commit();

    // Re-fetch complete order with partner details
    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        { model: OrderItem, as: "items" },
        { model: Address, as: "deliveryAddress" },
        { model: User, as: "customer", attributes: ["name", "phone"] },
        {
          model: DeliveryPartner,
          as: "deliveryPartner",
          include: [{ model: User, as: "user", attributes: ["id", "name", "phone", "email"] }],
        },
      ],
    });

    const formatted = formatOrder(updatedOrder);

    // Emit real-time socket events
    emitOrderEvent("order:assigned", updatedOrder);

    res.json({
      success: true,
      message: `Delivery partner ${partner.user?.name || ""} assigned successfully!`,
      data: { order: formatted },
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

module.exports = {
  getDashboard,
  getStats: getDashboard,
  getOrders,
  updateOrderStatus,
  getDeliveryPartners,
  assignDeliveryPartner,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getInventory,
  updateStock,
  updateStockById,
  bulkUpdateStock,
  bulkImportProducts,
  getShopSettings,
  updateShopSettings,
  updateShopStatus,
  getEarnings,
  requestPayout,
  uploadImage,
};
