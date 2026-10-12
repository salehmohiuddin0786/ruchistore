const { Op } = require("sequelize");
const {
  DeliveryPartner,
  DeliveryAssignment,
  Order,
  OrderItem,
  Product,
  Shop,
  Address,
  User,
  DeliveryEarning,
  OrderStatusHistory,
  Payment,
} = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");
const { acceptDeliveryOffer, rejectDeliveryOffer } = require("../services/deliveryAssignment.service");
const { ORDER_STATUSES, validateTransition } = require("../services/orderStateMachine");
const { deductInventory } = require("../services/inventoryService");
const { emitOrderEvent } = require("../sockets/socketHandler");
const { sequelize } = require("../config/db");
const { formatOrder } = require("./order.controller");

// Helper to get partner profile
const getPartnerFromUser = async (userId) => {
  const partner = await DeliveryPartner.findOne({ where: { user_id: userId } });
  if (!partner) {
    throw new AppError("Delivery partner profile not found", 404, "PARTNER_NOT_FOUND");
  }
  return partner;
};

// Delivery Dashboard summary
const getDashboard = asyncHandler(async (req, res) => {
  const partner = await getPartnerFromUser(req.user.id);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Default to online if not explicitly set
  if (partner.is_online === null || partner.is_online === undefined) {
    await partner.update({ is_online: true });
    partner.is_online = true;
  }

  // Synchronize all completed orders for this partner into DeliveryEarning
  const allCompletedOrders = await Order.findAll({
    where: {
      delivery_partner_id: partner.id,
      order_status: ORDER_STATUSES.DELIVERED,
    },
  });

  for (const ord of allCompletedOrders) {
    const existing = await DeliveryEarning.findOne({
      where: { delivery_partner_id: partner.id, order_id: ord.id },
    });
    const customerFee = parseFloat(ord.delivery_fee || 0);
    const feeToRecord = customerFee > 0 ? customerFee : 25.0;

    if (!existing) {
      await DeliveryEarning.create({
        delivery_partner_id: partner.id,
        order_id: ord.id,
        delivery_fee: feeToRecord,
        tip_amount: 0,
        bonus_amount: 0,
        total_earning: feeToRecord,
        payout_status: "PENDING",
        created_at: ord.delivered_at || ord.updated_at || ord.created_at || new Date(),
      });
    } else if (Math.abs(parseFloat(existing.delivery_fee) - feeToRecord) > 0.01) {
      await existing.update({
        delivery_fee: feeToRecord,
        total_earning: feeToRecord + parseFloat(existing.tip_amount || 0) + parseFloat(existing.bonus_amount || 0),
      });
    }
  }

  // Today's completed orders
  const todayDeliveriesCount = await Order.count({
    where: {
      delivery_partner_id: partner.id,
      order_status: ORDER_STATUSES.DELIVERED,
      [Op.or]: [
        { delivered_at: { [Op.gte]: startOfDay } },
        { updated_at: { [Op.gte]: startOfDay } },
      ],
    },
  });

  // All-time completed orders
  const totalDeliveriesCount = allCompletedOrders.length;

  // Today's earnings
  const todayEarnings = await DeliveryEarning.sum("total_earning", {
    where: {
      delivery_partner_id: partner.id,
      created_at: { [Op.gte]: startOfDay },
    },
  });

  // All-time earnings
  const totalEarnings = await DeliveryEarning.sum("total_earning", {
    where: {
      delivery_partner_id: partner.id,
    },
  });

  // Active / pending deliveries
  const activeOrders = await Order.findAll({
    where: {
      delivery_partner_id: partner.id,
      order_status: {
        [Op.in]: [ORDER_STATUSES.ASSIGNED, ORDER_STATUSES.PICKED_UP, ORDER_STATUSES.OUT_FOR_DELIVERY],
      },
    },
    include: [
      { model: Shop, as: "shop" },
      { model: Address, as: "deliveryAddress" },
      {
        model: OrderItem,
        as: "items",
        include: [{ model: Product, as: "product", attributes: ["id", "name", "image", "unit", "price"] }],
      },
      { model: User, as: "customer", attributes: ["id", "name", "phone"] },
    ],
  });

  // Check if there is an active OFFERED assignment right now
  const pendingOffer = await DeliveryAssignment.findOne({
    where: {
      delivery_partner_id: partner.id,
      status: "OFFERED",
      expires_at: { [Op.gt]: new Date() },
    },
    include: [
      {
        model: Order,
        as: "order",
        include: [
          { model: Shop, as: "shop" },
          { model: Address, as: "deliveryAddress" },
        ],
      },
    ],
  });

  const formattedStats = {
    todayDeliveries: todayDeliveriesCount,
    todayEarnings: Number(todayEarnings || 0),
    totalDeliveries: totalDeliveriesCount,
    totalEarnings: Number(totalEarnings || 0),
    completedOrders: totalDeliveriesCount,
    activeOrdersCount: activeOrders.length,
    pendingOrders: activeOrders.length,
  };

  res.json({
    success: true,
    data: {
      partner: {
        id: partner.id,
        isOnline: partner.is_online,
        isApproved: partner.is_approved,
        vehicleType: partner.vehicle_type,
        vehicleNumber: partner.vehicle_number,
        rating: partner.rating,
        totalDeliveries: totalDeliveriesCount,
        totalEarnings: Number(totalEarnings || 0),
      },
      stats: formattedStats,
      summary: formattedStats,
      activeOrders: activeOrders.map(formatOrder),
      pendingOffer,
    },
  });
});

// Toggle Online / Offline
const toggleOnline = asyncHandler(async (req, res) => {
  const partner = await getPartnerFromUser(req.user.id);
  const newStatus = !partner.is_online;
  await partner.update({ is_online: newStatus });

  res.json({
    success: true,
    message: newStatus ? "You are now ONLINE and ready for orders" : "You are now OFFLINE",
    data: { isOnline: newStatus },
  });
});

// Accept Delivery Offer
const acceptOffer = asyncHandler(async (req, res) => {
  const { assignmentId } = req.body;
  const partner = await getPartnerFromUser(req.user.id);

  const result = await acceptDeliveryOffer(assignmentId, partner.id);
  if (!result.success) {
    throw new AppError(result.message, 400, "OFFER_EXPIRED");
  }

  res.json({
    success: true,
    message: "Order accepted successfully!",
    data: { order: result.order },
  });
});

// Reject Delivery Offer
const rejectOffer = asyncHandler(async (req, res) => {
  const { assignmentId } = req.body;
  const partner = await getPartnerFromUser(req.user.id);

  const result = await rejectDeliveryOffer(assignmentId, partner.id);
  res.json({
    success: true,
    message: "Offer rejected",
  });
});

// Update Order Status (PICKED_UP, OUT_FOR_DELIVERY, DELIVERED)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, deliveryOtp } = req.body;
  const partner = await getPartnerFromUser(req.user.id);

  const order = await Order.findOne({
    where: { id, delivery_partner_id: partner.id },
    include: [{ model: OrderItem, as: "items" }],
  });

  if (!order) {
    throw new AppError("Order not found or not assigned to you", 404, "ORDER_NOT_FOUND");
  }

  // Validate State Machine transition
  const validation = validateTransition(order.order_status, status, "DELIVERY_PARTNER");
  if (!validation.valid) {
    throw new AppError(validation.reason, 409, "INVALID_STATE_TRANSITION");
  }

  // Optional OTP verification for final delivery handover
  if (status === ORDER_STATUSES.DELIVERED && order.otp_for_delivery && deliveryOtp) {
    if (order.otp_for_delivery !== deliveryOtp.toString().trim()) {
      throw new AppError("Invalid delivery confirmation OTP", 400, "INVALID_DELIVERY_OTP");
    }
  }

  const transaction = await sequelize.transaction();

  try {
    const updateData = { order_status: status };

    if (status === ORDER_STATUSES.PICKED_UP) {
      updateData.picked_up_at = new Date();
    } else if (status === ORDER_STATUSES.DELIVERED) {
      updateData.delivered_at = new Date();
      // If COD, mark payment PAID
      if (order.payment_method === "COD") {
        updateData.payment_status = "PAID";
        await Payment.update({ status: "SUCCESS" }, { where: { order_id: order.id }, transaction });
      }

      // Permanently deduct inventory
      await deductInventory(order.items, order.id, order.shop_id, transaction);

      // Record delivery partner earnings if not already recorded
      const existingEarning = await DeliveryEarning.findOne({
        where: { delivery_partner_id: partner.id, order_id: order.id },
        transaction,
      });

      const customerFee = parseFloat(order.delivery_fee || 0);
      const partnerEarning = customerFee > 0 ? customerFee : 25.0;

      if (!existingEarning) {
        await DeliveryEarning.create(
          {
            delivery_partner_id: partner.id,
            order_id: order.id,
            delivery_fee: partnerEarning,
            tip_amount: 0,
            bonus_amount: 0,
            total_earning: partnerEarning,
            payout_status: "PENDING",
          },
          { transaction }
        );

        // Increment partner totals
        await partner.increment(
          {
            total_deliveries: 1,
            total_earnings: partnerEarning,
          },
          { transaction }
        );
      }
    }

    await order.update(updateData, { transaction });

    await OrderStatusHistory.create(
      {
        order_id: order.id,
        status,
        changed_by_id: req.user.id,
        role: "DELIVERY_PARTNER",
        note: `Status updated by Delivery Partner (${partner.vehicle_number || "Rider"})`,
      },
      { transaction }
    );

    await transaction.commit();

    emitOrderEvent(`order:${status.toLowerCase()}`, order);

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      data: { order },
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// Partner Earnings history
const getEarnings = asyncHandler(async (req, res) => {
  const partner = await getPartnerFromUser(req.user.id);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const earnings = await DeliveryEarning.findAll({
    where: { delivery_partner_id: partner.id },
    include: [
      {
        model: Order,
        as: "order",
        attributes: ["id", "order_number", "delivery_fee", "total_amount", "created_at", "delivered_at"],
        include: [{ model: Shop, as: "shop", attributes: ["id", "name"] }],
      },
    ],
    order: [["created_at", "DESC"]],
    limit: 50,
  });

  const totalEarnings = await DeliveryEarning.sum("total_earning", {
    where: { delivery_partner_id: partner.id },
  });

  const todayEarnings = await DeliveryEarning.sum("total_earning", {
    where: {
      delivery_partner_id: partner.id,
      created_at: { [Op.gte]: startOfDay },
    },
  });

  const totalDeliveries = await Order.count({
    where: {
      delivery_partner_id: partner.id,
      order_status: ORDER_STATUSES.DELIVERED,
    },
  });

  const todayDeliveries = await Order.count({
    where: {
      delivery_partner_id: partner.id,
      order_status: ORDER_STATUSES.DELIVERED,
      [Op.or]: [
        { delivered_at: { [Op.gte]: startOfDay } },
        { updated_at: { [Op.gte]: startOfDay } },
      ],
    },
  });

  const mappedRecords = earnings.map((e) => {
    const plain = e.toJSON ? e.toJSON() : { ...e };
    return {
      id: plain.id,
      orderId: plain.order_id,
      orderNumber: plain.order?.order_number || `RS${plain.order_id}`,
      shopName: plain.order?.shop?.name || "Partner Store",
      totalEarning: Number(plain.total_earning || 0),
      deliveryFee: Number(plain.delivery_fee || 0),
      customerDeliveryFee: Number(plain.order?.delivery_fee || 0),
      tipAmount: Number(plain.tip_amount || 0),
      bonusAmount: Number(plain.bonus_amount || 0),
      payoutStatus: plain.payout_status,
      createdAt: plain.created_at,
    };
  });

  const summary = {
    todayEarnings: Number(todayEarnings || 0),
    totalEarnings: Number(totalEarnings || partner.total_earnings || 0),
    todayDeliveries,
    totalDeliveries: totalDeliveries || partner.total_deliveries,
    completedOrders: totalDeliveries || partner.total_deliveries,
    pendingOrders: 0,
  };

  res.json({
    success: true,
    data: {
      summary,
      totalEarnings: Number(totalEarnings || 0),
      todayEarnings: Number(todayEarnings || 0),
      records: mappedRecords,
      earnings: mappedRecords,
    },
  });
});

// Get partner profile
const getProfile = asyncHandler(async (req, res) => {
  const partner = await getPartnerFromUser(req.user.id);
  const user = await User.findByPk(req.user.id, {
    attributes: ["id", "name", "phone", "email", "role"],
  });

  res.json({
    success: true,
    data: {
      id: partner.id,
      userId: partner.user_id,
      name: user?.name,
      phone: user?.phone,
      email: user?.email,
      vehicleType: partner.vehicle_type,
      vehicleNumber: partner.vehicle_number || "",
      licenseNumber: partner.license_number || "",
      isOnline: partner.is_online,
      isApproved: partner.is_approved,
      status: partner.status,
      rating: partner.rating,
      totalDeliveries: partner.total_deliveries,
      totalEarnings: partner.total_earnings,
      upiId: "ramesh@oksbi",
    },
  });
});

// Update partner profile
const updateProfile = asyncHandler(async (req, res) => {
  const partner = await getPartnerFromUser(req.user.id);
  const { vehicleNumber, vehicleType, licenseNumber } = req.body;
  const updateData = {};
  if (vehicleNumber !== undefined) updateData.vehicle_number = vehicleNumber;
  if (vehicleType !== undefined) updateData.vehicle_type = vehicleType;
  if (licenseNumber !== undefined) updateData.license_number = licenseNumber;

  await partner.update(updateData);

  res.json({
    success: true,
    message: "Profile details updated successfully",
    data: partner,
  });
});

// Update online status (PUT/POST /delivery/status)
const updateStatus = asyncHandler(async (req, res) => {
  const partner = await getPartnerFromUser(req.user.id);
  const { isOnline } = req.body;
  const newStatus = isOnline !== undefined ? Boolean(isOnline) : !partner.is_online;
  await partner.update({ is_online: newStatus });

  res.json({
    success: true,
    message: newStatus ? "You are now ONLINE and ready for orders" : "You are now OFFLINE",
    data: { isOnline: newStatus },
  });
});

// Get all orders for this delivery partner
const getOrders = asyncHandler(async (req, res) => {
  const partner = await getPartnerFromUser(req.user.id);
  const orders = await Order.findAll({
    where: { delivery_partner_id: partner.id },
    order: [["created_at", "DESC"]],
    include: [
      { model: Shop, as: "shop", attributes: ["id", "name", "address", "phone"] },
      { model: Address, as: "deliveryAddress" },
      {
        model: OrderItem,
        as: "items",
        include: [{ model: Product, as: "product", attributes: ["id", "name", "image", "unit", "price"] }],
      },
      { model: User, as: "customer", attributes: ["id", "name", "phone"] },
    ],
  });

  const mapped = orders.map((o) => {
    const plain = o.toJSON ? o.toJSON() : { ...o };
    const customerFee = parseFloat(plain.delivery_fee || 0);
    const riderPayout = customerFee > 0 ? customerFee : 25.0;

    const formattedItems = (plain.items || []).map((item) => {
      const it = item.toJSON ? item.toJSON() : { ...item };
      const effectivePrice = Number(it.discount_price || it.price || 0);
      return {
        ...it,
        name: it.name || it.product?.name || "Grocery Item",
        productName: it.product?.name || it.name,
        productImage: it.product?.image || null,
        unit: it.unit || it.product?.unit || "pack",
        price: effectivePrice,
        quantity: Number(it.quantity || 1),
        totalPrice: Number(it.total_price || effectivePrice * (it.quantity || 1)),
      };
    });

    return {
      ...plain,
      orderStatus: plain.order_status,
      customerDeliveryFee: customerFee,
      deliveryFee: customerFee,
      riderPayout,
      totalAmount: Number(plain.total_amount || 0),
      paymentMethod: plain.payment_method,
      paymentStatus: plain.payment_status,
      createdAt: plain.created_at,
      deliveredAt: plain.delivered_at,
      user: plain.customer,
      customer: plain.customer,
      address: plain.deliveryAddress,
      deliveryAddress: plain.deliveryAddress,
      items: formattedItems,
    };
  });

  res.json({
    success: true,
    data: { orders: mapped },
  });
});

// Get single order details
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const partner = await getPartnerFromUser(req.user.id);
  const order = await Order.findOne({
    where: { id, delivery_partner_id: partner.id },
    include: [
      { model: Shop, as: "shop" },
      { model: Address, as: "deliveryAddress" },
      {
        model: OrderItem,
        as: "items",
        include: [{ model: Product, as: "product", attributes: ["id", "name", "image", "unit", "price"] }],
      },
      { model: User, as: "customer", attributes: ["id", "name", "phone"] },
    ],
  });

  if (!order) {
    throw new AppError("Order not found or not assigned to you", 404, "ORDER_NOT_FOUND");
  }

  const plain = order.toJSON ? order.toJSON() : { ...order };
  const customerFee = parseFloat(plain.delivery_fee || 0);
  const riderPayout = customerFee > 0 ? customerFee : 25.0;

  const formattedItems = (plain.items || []).map((item) => {
    const it = item.toJSON ? item.toJSON() : { ...item };
    const effectivePrice = Number(it.discount_price || it.price || 0);
    return {
      ...it,
      name: it.name || it.product?.name || "Grocery Item",
      productName: it.product?.name || it.name,
      productImage: it.product?.image || null,
      unit: it.unit || it.product?.unit || "pack",
      price: effectivePrice,
      quantity: Number(it.quantity || 1),
      totalPrice: Number(it.total_price || effectivePrice * (it.quantity || 1)),
    };
  });

  res.json({
    success: true,
    data: {
      ...plain,
      orderStatus: plain.order_status,
      recipientName: plain.recipient_name || plain.recipientName || null,
      recipientPhone: plain.recipient_phone || plain.recipientPhone || null,
      isForOther: Boolean(plain.is_for_other || plain.recipient_name),
      customerDeliveryFee: customerFee,
      deliveryFee: customerFee,
      riderPayout,
      totalAmount: Number(plain.total_amount || 0),
      paymentMethod: plain.payment_method,
      paymentStatus: plain.payment_status,
      createdAt: plain.created_at,
      deliveredAt: plain.delivered_at,
      user: plain.customer,
      customer: plain.customer,
      address: plain.deliveryAddress,
      deliveryAddress: plain.deliveryAddress,
      items: formattedItems,
    },
  });
});

// Accept assignment by param ID
const acceptAssignmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const partner = await getPartnerFromUser(req.user.id);
  const result = await acceptDeliveryOffer(id, partner.id);
  if (!result.success) {
    throw new AppError(result.message, 400, "OFFER_EXPIRED");
  }

  res.json({
    success: true,
    message: "Order accepted successfully!",
    data: { orderId: result.order?.id, order: result.order },
  });
});

// Reject assignment by param ID
const rejectAssignmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const partner = await getPartnerFromUser(req.user.id);
  await rejectDeliveryOffer(id, partner.id);

  res.json({
    success: true,
    message: "Offer rejected",
  });
});

module.exports = {
  getDashboard,
  toggleOnline,
  updateStatus,
  getProfile,
  updateProfile,
  getOrders,
  getOrderById,
  acceptAssignmentById,
  rejectAssignmentById,
  acceptOffer,
  rejectOffer,
  updateOrderStatus,
  getEarnings,
};
