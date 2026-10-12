const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");
const {
  User,
  Shop,
  Product,
  Category,
  Order,
  OrderItem,
  DeliveryPartner,
  Coupon,
  Banner,
  Offer,
  Payment,
  Refund,
  ShopDocument,
  Inventory,
  OrderStatusHistory,
  SupportTicket,
} = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");
const { sequelize } = require("../config/db");
const { emitOrderEvent } = require("../sockets/socketHandler");
const { ORDER_STATUSES } = require("../services/orderStateMachine");
const { formatOrder } = require("./order.controller");

// Admin Dashboard KPI Stats
const getDashboard = asyncHandler(async (req, res) => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalCustomers,
    totalShops,
    totalProducts,
    totalDeliveryPartners,
    pendingShopsCount,
    todayOrdersCount,
    todayRevenueSum,
    lowStockCount,
    activeRidersCount,
  ] = await Promise.all([
    User.count({ where: { role: "CUSTOMER" } }),
    Shop.count(),
    Product.count(),
    DeliveryPartner.count(),
    Shop.count({ where: { status: "PENDING" } }),
    Order.count({ where: { created_at: { [Op.gte]: startOfDay } } }),
    Order.sum("total_amount", {
      where: {
        created_at: { [Op.gte]: startOfDay },
        order_status: { [Op.ne]: "CANCELLED" },
      },
    }),
    Product.count({
      where: {
        stock_quantity: { [Op.lte]: sequelize.col("low_stock_threshold") },
      },
    }),
    DeliveryPartner.count({ where: { is_online: true } }),
  ]);

  // Recent 10 orders across platform
  const recentOrders = await Order.findAll({
    limit: 10,
    order: [["created_at", "DESC"]],
    include: [
      { model: Shop, as: "shop", attributes: ["name"] },
      { model: User, as: "customer", attributes: ["name", "phone"] },
    ],
  });

  res.json({
    success: true,
    data: {
      totalRevenue: Number(todayRevenueSum || 0),
      totalOrders: Number(todayOrdersCount || 0),
      totalShops,
      totalDeliveryPartners,
      pendingShopsCount,
      activeOrdersCount: todayOrdersCount,
      stats: {
        totalCustomers,
        totalShops,
        totalProducts,
        totalDeliveryPartners,
        pendingShopsCount,
        todayOrdersCount,
        todayRevenue: todayRevenueSum || 0,
        lowStockCount,
        activeRidersCount,
      },
      recentOrders: recentOrders.map(formatOrder),
    },
  });
});

// User Management (Customers & Partners)
const getUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const whereClause = {};

  if (role) whereClause.role = role;
  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
    ];
  }

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { count, rows: users } = await User.findAndCountAll({
    where: whereClause,
    attributes: { exclude: ["password"] },
    limit: parseInt(limit, 10),
    offset,
    order: [["created_at", "DESC"]],
  });

  res.json({
    success: true,
    data: { users },
    meta: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / limit),
    },
  });
});

// Block / Unblock User
const toggleBlockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findByPk(id);

  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  if (user.role === "ADMIN") throw new AppError("Cannot block an admin user", 400, "CANNOT_BLOCK_ADMIN");

  const newStatus = !user.is_blocked;
  await user.update({ is_blocked: newStatus });

  res.json({
    success: true,
    message: newStatus ? "User has been blocked" : "User has been unblocked",
    data: { isBlocked: newStatus },
  });
});

// Shop Management: List all shops
const getShops = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const whereClause = {};

  if (status) whereClause.status = status;
  if (search) whereClause.name = { [Op.like]: `%${search}%` };

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { count, rows: shops } = await Shop.findAndCountAll({
    where: whereClause,
    include: [{ model: User, as: "owner", attributes: ["name", "email", "phone"] }],
    limit: parseInt(limit, 10),
    offset,
    order: [["created_at", "DESC"]],
  });

  const formattedShops = shops.map((s) => {
    const plain = s.toJSON ? s.toJSON() : { ...s };
    const isApproved = plain.status === "APPROVED";
    return {
      ...plain,
      isApproved,
      commissionRate: plain.commission_percentage || 10,
      minOrderAmount: Number(plain.minimum_order || 0),
    };
  });

  res.json({
    success: true,
    data: { shops: formattedShops },
    meta: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / limit),
    },
  });
});

// Approve / Reject / Block Shop
const updateShopStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { status, isApproved, commissionPercentage } = req.body;

  const shop = await Shop.findByPk(id);
  if (!shop) throw new AppError("Shop not found", 404, "SHOP_NOT_FOUND");

  if (status === undefined && isApproved !== undefined) {
    status = isApproved ? "APPROVED" : "PENDING";
  }
  if (!status) {
    status = shop.status === "APPROVED" ? "PENDING" : "APPROVED";
  }

  const approved = status === "APPROVED" || isApproved === true;
  const updateData = { status: approved ? "APPROVED" : status };
  if (commissionPercentage !== undefined) {
    updateData.commission_percentage = parseFloat(commissionPercentage);
  }
  if (approved) {
    updateData.is_open = true;
  }

  await shop.update(updateData);

  if (approved && shop.owner_id) {
    await User.update({ role: "SHOP_OWNER" }, { where: { id: shop.owner_id } });
  }

  const plain = shop.toJSON ? shop.toJSON() : { ...shop };
  plain.isApproved = approved;

  res.json({
    success: true,
    message: `Shop status updated to ${updateData.status}`,
    data: { shop: plain },
  });
});

// Delivery Partners: List & Approve
const getDeliveryPartners = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const whereClause = {};
  if (status) whereClause.status = status;

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { count, rows: partners } = await DeliveryPartner.findAndCountAll({
    where: whereClause,
    include: [{ model: User, as: "user", attributes: ["name", "email", "phone"] }],
    limit: parseInt(limit, 10),
    offset,
    order: [["created_at", "DESC"]],
  });

  const formattedPartners = partners.map((p) => {
    const plain = p.toJSON ? p.toJSON() : { ...p };
    const isApproved = Boolean(plain.is_approved || plain.status === "APPROVED");
    return {
      ...plain,
      isApproved,
      isOnline: Boolean(plain.is_online),
      vehicleType: plain.vehicle_type,
      vehicleNumber: plain.vehicle_number,
      totalDeliveries: plain.total_deliveries || 0,
      totalEarnings: Number(plain.total_earnings || 0),
    };
  });

  res.json({
    success: true,
    data: { partners: formattedPartners },
    meta: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(count / limit),
    },
  });
});

// Update Delivery Partner Status
const updateDeliveryPartnerStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { status, isApproved } = req.body;

  const partner = await DeliveryPartner.findByPk(id);
  if (!partner) throw new AppError("Delivery partner not found", 404, "PARTNER_NOT_FOUND");

  if (status === undefined && isApproved !== undefined) {
    status = isApproved ? "APPROVED" : "PENDING";
  }
  if (!status) {
    status = (partner.status === "APPROVED" || partner.is_approved) ? "PENDING" : "APPROVED";
  }

  const approved = status === "APPROVED" || isApproved === true;
  await partner.update({
    status: approved ? "APPROVED" : "PENDING",
    is_approved: approved,
    is_online: approved ? true : partner.is_online,
  });

  if (approved && partner.user_id) {
    await User.update({ role: "DELIVERY_PARTNER" }, { where: { id: partner.user_id } });
  }

  const plain = partner.toJSON ? partner.toJSON() : { ...partner };
  plain.isApproved = approved;
  plain.isOnline = Boolean(plain.is_online);

  res.json({
    success: true,
    message: `Partner status updated to ${plain.status}`,
    data: { partner: plain },
  });
});

// Category Management (Admin CRUD)
const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, description, displayOrder = 0 } = req.body;
  if (!name) throw new AppError("Category name is required", 400, "MISSING_NAME");

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const imageUrl = req.file ? `/uploads/documents/${req.file.filename}` : req.body.image || null;

  const category = await Category.create({
    name,
    slug,
    icon: icon || "Layers",
    description,
    image: imageUrl,
    display_order: displayOrder,
  });

  res.status(201).json({
    success: true,
    message: "Category created successfully",
    data: { category },
  });
});

const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findByPk(id);
  if (!category) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");

  const { name, icon, description, displayOrder, isActive } = req.body;
  const updateData = {};
  if (name) {
    updateData.name = name;
    updateData.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  }
  if (icon) updateData.icon = icon;
  if (description !== undefined) updateData.description = description;
  if (displayOrder !== undefined) updateData.display_order = displayOrder;
  if (isActive !== undefined) updateData.is_active = isActive;
  if (req.file) updateData.image = `/uploads/documents/${req.file.filename}`;

  await category.update(updateData);

  res.json({
    success: true,
    message: "Category updated",
    data: { category },
  });
});

const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const category = await Category.findByPk(id);
  if (!category) throw new AppError("Category not found", 404, "CATEGORY_NOT_FOUND");

  await category.destroy();
  res.json({ success: true, message: "Category deleted" });
});

// Coupon Management (Admin CRUD)
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.findAll({
    order: [["created_at", "DESC"]],
  });
  res.json({
    success: true,
    data: { coupons },
    coupons,
  });
});

const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discountType = "FIXED",
    discountValue,
    minOrderAmount = 0,
    maxDiscountAmount,
    startDate,
    expiryDate,
    usageLimit,
    perUserLimit = 1,
    isFirstOrderOnly = false,
    shopId,
  } = req.body;

  if (!code || !discountValue) {
    throw new AppError("Code and discount value are required", 400, "MISSING_FIELDS");
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase().trim(),
    description,
    discount_type: discountType,
    discount_value: parseFloat(discountValue),
    min_order_amount: parseFloat(minOrderAmount || 0),
    max_discount_amount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
    start_date: startDate ? new Date(startDate) : null,
    expiry_date: expiryDate ? new Date(expiryDate) : null,
    usage_limit: usageLimit ? parseInt(usageLimit, 10) : null,
    per_user_limit: parseInt(perUserLimit, 10) || 1,
    is_first_order_only: isFirstOrderOnly,
    shop_id: shopId || null,
    is_active: true,
  });

  res.status(201).json({
    success: true,
    message: "Coupon created successfully",
    data: { coupon },
  });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const coupon = await Coupon.findByPk(id);
  if (!coupon) throw new AppError("Coupon not found", 404, "COUPON_NOT_FOUND");

  await coupon.destroy();
  res.json({ success: true, message: "Coupon deleted" });
});

// Banner Management (Admin CRUD)
const getBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.findAll({ order: [["display_order", "ASC"]] });
  res.json({ success: true, data: { banners } });
});

const createBanner = asyncHandler(async (req, res) => {
  const { title, subtitle, link, displayOrder = 0 } = req.body;
  const imageUrl = req.file ? `/uploads/documents/${req.file.filename}` : req.body.image;

  if (!title || !imageUrl) {
    throw new AppError("Title and image are required", 400, "MISSING_BANNER_FIELDS");
  }

  const banner = await Banner.create({
    title,
    subtitle,
    image: imageUrl,
    link: link || "/categories",
    display_order: displayOrder,
  });

  res.status(201).json({
    success: true,
    message: "Banner created successfully",
    data: { banner },
  });
});

const deleteBanner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const banner = await Banner.findByPk(id);
  if (!banner) throw new AppError("Banner not found", 404, "BANNER_NOT_FOUND");

  await banner.destroy();
  res.json({ success: true, message: "Banner deleted" });
});

// Refund Handling
const processRefund = asyncHandler(async (req, res) => {
  const { orderId, amount, reason } = req.body;

  const order = await Order.findByPk(orderId, {
    include: [{ model: Payment, as: "payment" }],
  });

  if (!order) throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");

  const refundAmount = amount ? parseFloat(amount) : parseFloat(order.total_amount);

  const refund = await Refund.create({
    payment_id: order.payment?.id || null,
    order_id: order.id,
    amount: refundAmount,
    reason: reason || "Processed by admin",
    status: "PROCESSED",
    processed_by_id: req.user.id,
  });

  await order.update({ order_status: ORDER_STATUSES.REFUNDED, payment_status: "REFUNDED" });

  await OrderStatusHistory.create({
    order_id: order.id,
    status: ORDER_STATUSES.REFUNDED,
    changed_by_id: req.user.id,
    role: "ADMIN",
    note: `Refund of ₹${refundAmount} issued. Reason: ${reason || "N/A"}`,
  });

  emitOrderEvent("order:refunded", order);

  res.json({
    success: true,
    message: `Refund of ₹${refundAmount} processed successfully`,
    data: { refund },
  });
});

// Admin Orders
const getOrders = asyncHandler(async (req, res) => {
  const { limit = 20, page = 1, status } = req.query;
  const whereClause = {};
  if (status) whereClause.order_status = status;
  const parsedLimit = parseInt(limit, 10);
  const parsedPage = parseInt(page, 10);
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows: orders } = await Order.findAndCountAll({
    where: whereClause,
    limit: parsedLimit,
    offset,
    order: [["created_at", "DESC"]],
    include: [
      { model: Shop, as: "shop", attributes: ["id", "name", "address"] },
      { model: User, as: "customer", attributes: ["id", "name", "phone", "email"] },
      {
        model: DeliveryPartner,
        as: "deliveryPartner",
        include: [{ model: User, as: "user", attributes: ["id", "name", "phone"] }],
      },
      { model: OrderItem, as: "items" },
    ],
  });

  const formatted = orders.map(formatOrder);

  res.json({
    success: true,
    data: { orders: formatted, count },
  });
});

// Admin Payments
const getPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.findAll({
    order: [["created_at", "DESC"]],
    limit: 50,
  });
  const mapped = payments.map((p) => {
    const plain = p.toJSON();
    return {
      ...plain,
      orderId: plain.order_id,
      transactionId: plain.transaction_id || `TXN-${plain.id}`,
      paymentMethod: plain.payment_method,
      createdAt: plain.created_at,
    };
  });
  res.json({
    success: true,
    data: { payments: mapped },
  });
});

// Admin Support Tickets
const getSupportTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.findAll({
    order: [["created_at", "DESC"]],
    limit: 50,
    include: [{ model: User, as: "user", attributes: ["name", "email", "phone"] }],
  });
  res.json({
    success: true,
    data: { tickets },
  });
});

const resolveSupportTicket = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticket = await SupportTicket.findByPk(id);
  if (ticket) {
    await ticket.update({ status: "RESOLVED" });
  }
  res.json({
    success: true,
    message: "Ticket marked as resolved",
  });
});

const createShop = asyncHandler(async (req, res) => {
  const {
    ownerName,
    ownerEmail,
    ownerPhone,
    ownerPassword,
    shopName,
    shopAddress,
    city = "Hyderabad",
    pincode = "500081",
    commissionPercentage = 10.0,
    status = "APPROVED",
  } = req.body;

  if (!shopName || !ownerPhone) {
    throw new AppError("Shop name and owner phone are required", 400, "MISSING_FIELDS");
  }

  const cleanPhone = String(ownerPhone).replace(/\D/g, "");

  // Find or create Owner user
  let owner = await User.findOne({
    where: { [Op.or]: [{ phone: cleanPhone }, ...(ownerEmail ? [{ email: ownerEmail }] : [])] },
  });

  if (!owner) {
    const hashedPassword = await bcrypt.hash(ownerPassword || "Admin@123", 10);
    owner = await User.create({
      name: ownerName || shopName,
      phone: cleanPhone,
      email: ownerEmail || `owner.${Date.now()}@ruchistore.com`,
      password: hashedPassword,
      role: "SHOP_OWNER",
      is_verified: true,
    });
  } else {
    await owner.update({ role: "SHOP_OWNER" });
  }

  // Generate unique slug
  const baseSlug = shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  let slug = baseSlug;
  let counter = 1;
  while (await Shop.findOne({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const shop = await Shop.create({
    owner_id: owner.id,
    name: shopName,
    slug,
    address: shopAddress || "Main Market, Hyderabad",
    city,
    pincode,
    phone: cleanPhone,
    email: ownerEmail,
    commission_percentage: commissionPercentage,
    status: status === "PENDING" ? "PENDING" : "APPROVED",
    is_open: true,
  });

  res.status(201).json({
    success: true,
    message: "Shop and Owner created successfully",
    data: { shop, owner },
  });
});

const createDeliveryPartner = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    vehicleType = "BIKE",
    vehicleNumber,
    licenseNumber,
    status = "APPROVED",
  } = req.body;

  if (!name || !phone) {
    throw new AppError("Rider name and phone are required", 400, "MISSING_FIELDS");
  }

  const cleanPhone = String(phone).replace(/\D/g, "");

  let riderUser = await User.findOne({
    where: { [Op.or]: [{ phone: cleanPhone }, ...(email ? [{ email }] : [])] },
  });

  if (!riderUser) {
    const hashedPassword = await bcrypt.hash(password || "Admin@123", 10);
    riderUser = await User.create({
      name,
      phone: cleanPhone,
      email: email || `rider.${Date.now()}@ruchistore.com`,
      password: hashedPassword,
      role: "DELIVERY_PARTNER",
      is_verified: true,
    });
  } else {
    await riderUser.update({ role: "DELIVERY_PARTNER" });
  }

  const partner = await DeliveryPartner.create({
    user_id: riderUser.id,
    vehicle_type: vehicleType,
    vehicle_number: vehicleNumber || "TS-09-XX-0000",
    license_number: licenseNumber || "DL-RUCHI-0000",
    status: status === "PENDING" ? "PENDING" : "APPROVED",
    is_approved: status !== "PENDING",
    is_online: true,
  });

  res.status(201).json({
    success: true,
    message: "Delivery partner created successfully",
    data: { partner, user: riderUser },
  });
});

module.exports = {
  getDashboard,
  getOrders,
  getUsers,
  toggleBlockUser,
  getShops,
  createShop,
  updateShopStatus,
  getDeliveryPartners,
  createDeliveryPartner,
  updateDeliveryPartnerStatus,
  createCategory,
  updateCategory,
  deleteCategory,
  getCoupons,
  createCoupon,
  deleteCoupon,
  getBanners,
  createBanner,
  deleteBanner,
  processRefund,
  getPayments,
  getSupportTickets,
  resolveSupportTicket,
};
