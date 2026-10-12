const { sequelize } = require("../config/db");
const {
  Order,
  OrderItem,
  OrderStatusHistory,
  Product,
  Shop,
  Address,
  Coupon,
  CouponUsage,
  Cart,
  CartItem,
  Payment,
  DeliveryPartner,
  User,
} = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");
const { calculateOrderPricing } = require("../services/pricingService");
const { reserveInventory, releaseInventory } = require("../services/inventoryService");
const { ORDER_STATUSES, validateTransition } = require("../services/orderStateMachine");
const { emitOrderEvent } = require("../sockets/socketHandler");
const { createRazorpayOrder, isRazorpayConfigured } = require("../services/razorpayService");

// Generate Safe Order Number: RS + YYMMDD + 4-digit sequence
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `RS${dateStr}${rand}`;
};

// Normalize Order for client consumption (both camelCase and snake_case properties)
const formatOrder = (orderInstance) => {
  if (!orderInstance) return null;
  const o = orderInstance.toJSON ? orderInstance.toJSON() : { ...orderInstance };

  const formattedItems = (o.items || []).map((item) => {
    const itemData = item.toJSON ? item.toJSON() : { ...item };
    const effectivePrice = Number(itemData.discount_price || itemData.price || 0);
    const resolvedName = itemData.name || itemData.product?.name || itemData.productName || "Grocery Item";
    return {
      ...itemData,
      name: resolvedName,
      productName: resolvedName,
      productImage: itemData.product?.image || itemData.image || null,
      unit: itemData.unit || itemData.product?.unit || "pack",
      unitPrice: effectivePrice,
      price: effectivePrice,
      quantity: Number(itemData.quantity || 1),
      totalPrice: Number(itemData.total_price || effectivePrice * (itemData.quantity || 1)),
    };
  });

  const fee = Number(o.delivery_fee !== undefined ? o.delivery_fee : o.deliveryFee || 0);

  return {
    ...o,
    orderStatus: o.order_status || o.orderStatus,
    orderNumber: o.order_number || o.orderNumber,
    recipientName: o.recipient_name || o.recipientName || null,
    recipientPhone: o.recipient_phone || o.recipientPhone || null,
    isForOther: Boolean(o.is_for_other || o.recipient_name || o.recipientName),
    totalAmount: Number(o.total_amount || o.totalAmount || 0),
    subtotal: Number(o.subtotal || 0),
    deliveryFee: fee,
    tax: Number(o.tax || 0),
    discount: Number(o.discount || 0),
    paymentMethod: o.payment_method || o.paymentMethod,
    paymentStatus: o.payment_status || o.paymentStatus,
    createdAt: o.created_at || o.createdAt,
    updatedAt: o.updated_at || o.updatedAt,
    items: formattedItems,
    address: o.deliveryAddress || o.address,
    user: o.customer || o.user || null,
    customer: o.customer || o.user || null,
    deliveryPartner: o.deliveryPartner || o.delivery_partner || null,
    deliveryPartnerId: o.delivery_partner_id || o.deliveryPartnerId || null,
    customerDeliveryFee: fee,
    riderPayout: fee > 0 ? fee : 25.0,
    deliveredAt: o.delivered_at || o.deliveredAt || null,
  };
};

// Create Order (Atomic Transaction)
const createOrder = asyncHandler(async (req, res) => {
  let {
    items = [],
    addressId,
    couponCode,
    paymentMethod = "COD",
    deliveryInstructions,
    recipientName,
    recipientPhone,
    isForOther,
  } = req.body;

  // Fallback to active DB Cart if items array is omitted or empty
  if (!items || items.length === 0) {
    const userCart = await Cart.findOne({
      where: { user_id: req.user.id },
      include: [
        {
          model: CartItem,
          as: "items",
          include: [{ model: Product, as: "product" }],
        },
      ],
    });

    if (userCart && userCart.items && userCart.items.length > 0) {
      items = userCart.items.map((ci) => ({
        productId: ci.product_id,
        id: ci.product_id,
        quantity: ci.quantity,
      }));
    }
  }

  // Normalize and aggregate any duplicate items
  const aggregatedItemsMap = new Map();
  for (const it of (items || [])) {
    const pId = Number(it.productId || it.id || it.product_id);
    if (!pId) continue;
    const qty = Math.max(1, parseInt(it.quantity || 1, 10));
    if (aggregatedItemsMap.has(pId)) {
      aggregatedItemsMap.get(pId).quantity += qty;
    } else {
      aggregatedItemsMap.set(pId, { productId: pId, id: pId, quantity: qty });
    }
  }
  items = Array.from(aggregatedItemsMap.values());

  if (!items || items.length === 0) {
    throw new AppError("Order must contain at least one item", 400, "EMPTY_ORDER");
  }

  if (!addressId) {
    const defaultAddress =
      (await Address.findOne({ where: { user_id: req.user.id, is_default: true } })) ||
      (await Address.findOne({ where: { user_id: req.user.id } }));
    if (defaultAddress) {
      addressId = defaultAddress.id;
    } else {
      throw new AppError("Delivery address is required", 400, "MISSING_ADDRESS");
    }
  }

  const address = await Address.findOne({
    where: { id: addressId, user_id: req.user.id },
  });

  if (!address) {
    throw new AppError("Selected delivery address not found", 404, "ADDRESS_NOT_FOUND");
  }

  // Start Transaction
  const transaction = await sequelize.transaction();

  try {
    // 1. Fetch & Lock Products
    const productIds = items.map((i) => i.productId || i.id);
    const products = await Product.findAll({
      where: { id: productIds },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (products.length !== productIds.length) {
      throw new AppError("One or more selected products are invalid or unavailable", 400, "INVALID_PRODUCTS");
    }

    const productMap = new Map(products.map((p) => [p.id, p]));
    const firstShopId = products[0].shop_id;

    // Verify all products belong to the same shop
    for (const p of products) {
      if (p.shop_id !== firstShopId) {
        throw new AppError("All items in an order must be from the same shop", 400, "MULTIPLE_SHOPS");
      }
    }

    // Verify Shop status
    const shop = await Shop.findByPk(firstShopId, { transaction });
    if (!shop || shop.status !== "APPROVED" || !shop.is_open) {
      throw new AppError("This shop is currently closed or unavailable", 400, "SHOP_UNAVAILABLE");
    }

    // Prepare items for pure pricing calculator
    const pricingItems = items.map((item) => {
      const prod = productMap.get(item.productId || item.id);
      return {
        product: prod,
        quantity: item.quantity,
      };
    });

    // Check Coupon
    let coupon = null;
    if (couponCode) {
      coupon = await Coupon.findOne({
        where: { code: couponCode.toUpperCase().trim(), is_active: true },
        transaction,
      });
    }

    // 2. Pure Server-Authoritative Price Calculation
    const pricing = calculateOrderPricing(pricingItems, coupon);

    // Minimum order check
    if (shop.minimum_order > 0 && pricing.subtotal < parseFloat(shop.minimum_order)) {
      throw new AppError(`Minimum order for ${shop.name} is ₹${shop.minimum_order}`, 400, "MINIMUM_ORDER_NOT_MET");
    }

    // 3. Generate Order Number & Record
    const orderNumber = generateOrderNumber();
    const orderOtp = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit handover OTP

    const order = await Order.create(
      {
        order_number: orderNumber,
        user_id: req.user.id,
        recipient_name: recipientName ? String(recipientName).trim() : null,
        recipient_phone: recipientPhone ? String(recipientPhone).trim() : null,
        is_for_other: Boolean(isForOther || (recipientName && recipientPhone)),
        shop_id: shop.id,
        address_id: address.id,
        subtotal: pricing.subtotal,
        discount: pricing.productDiscount + pricing.couponDiscount,
        coupon_id: pricing.coupon ? pricing.coupon.id : null,
        delivery_fee: pricing.deliveryFee,
        tax: pricing.tax,
        total_amount: pricing.totalAmount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === "COD" ? "PENDING" : "PENDING",
        order_status: ORDER_STATUSES.PLACED,
        delivery_lat: address.latitude,
        delivery_lng: address.longitude,
        otp_for_delivery: orderOtp,
      },
      { transaction }
    );

    // 4. Reserve Inventory (Row-Level Lock)
    await reserveInventory(pricingItems, order.id, shop.id, transaction);

    // 5. Create Order Items
    for (const item of pricing.items) {
      await OrderItem.create(
        {
          order_id: order.id,
          product_id: item.productId,
          name: item.name,
          unit: item.unit,
          price: item.price,
          discount_price: item.effectivePrice,
          quantity: item.quantity,
          total_price: item.itemTotal,
        },
        { transaction }
      );
    }

    // 6. Record Status History
    await OrderStatusHistory.create(
      {
        order_id: order.id,
        status: ORDER_STATUSES.PLACED,
        changed_by_id: req.user.id,
        role: "CUSTOMER",
        note: `Order placed via ${paymentMethod}`,
      },
      { transaction }
    );

    // 7. Track Coupon Usage
    if (pricing.coupon) {
      await CouponUsage.create(
        {
          coupon_id: pricing.coupon.id,
          user_id: req.user.id,
          order_id: order.id,
          discount_amount: pricing.couponDiscount,
        },
        { transaction }
      );
    }

    // 8. Payment Handling
    let razorpayPayload = null;
    if (paymentMethod === "RAZORPAY" || paymentMethod === "ONLINE") {
      const razorpayOrder = await createRazorpayOrder(pricing.totalAmountPaise, order.order_number);
      await Payment.create(
        {
          order_id: order.id,
          user_id: req.user.id,
          amount: pricing.totalAmount,
          payment_method: "RAZORPAY",
          gateway_name: "RAZORPAY",
          gateway_order_id: razorpayOrder.id,
          status: "PENDING",
        },
        { transaction }
      );

      razorpayPayload = {
        orderId: razorpayOrder.id,
        amount: pricing.totalAmountPaise,
        currency: "INR",
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder",
      };
    } else {
      // COD
      await Payment.create(
        {
          order_id: order.id,
          user_id: req.user.id,
          amount: pricing.totalAmount,
          payment_method: "COD",
          gateway_name: "CASH_ON_DELIVERY",
          status: "PENDING",
        },
        { transaction }
      );
    }

    // 9. Clear Cart
    const userCart = await Cart.findOne({ where: { user_id: req.user.id }, transaction });
    if (userCart) {
      await CartItem.destroy({ where: { cart_id: userCart.id }, transaction });
      await userCart.update({ shop_id: null }, { transaction });
    }

    // Commit Transaction
    await transaction.commit();

    // 10. Emit Socket Event
    emitOrderEvent("order:created", order);

    const formattedOrder = formatOrder(order);

    res.status(201).json({
      success: true,
      message: "Order placed successfully!",
      data: {
        order: formattedOrder,
        id: order.id,
        ...formattedOrder,
        razorpay: razorpayPayload,
      },
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

// Get customer orders with pagination
const getOrders = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page || 1, 10);
  const limit = Math.min(50, parseInt(req.query.limit || 15, 10));
  const offset = (page - 1) * limit;

  const { count, rows: orders } = await Order.findAndCountAll({
    where: { user_id: req.user.id },
    include: [
      {
        model: Shop,
        as: "shop",
        attributes: ["id", "name", "slug", "logo", "phone", "address"],
      },
      {
        model: OrderItem,
        as: "items",
      },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
  });

  const formattedOrders = orders.map(formatOrder);

  res.json({
    success: true,
    data: { orders: formattedOrders },
    meta: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
    },
  });
});

// Get order details by ID
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findByPk(id, {
    include: [
      {
        model: Shop,
        as: "shop",
        attributes: ["id", "name", "slug", "logo", "phone", "address", "latitude", "longitude"],
      },
      {
        model: OrderItem,
        as: "items",
        include: [{ model: Product, as: "product", attributes: ["id", "name", "image"] }],
      },
      {
        model: Address,
        as: "deliveryAddress",
      },
      {
        model: DeliveryPartner,
        as: "deliveryPartner",
        include: [{ model: User, as: "user", attributes: ["name", "phone", "profile_image"] }],
      },
      {
        model: OrderStatusHistory,
        as: "statusHistory",
        order: [["created_at", "ASC"]],
      },
      {
        model: Payment,
        as: "payment",
      },
    ],
  });

  if (!order) {
    throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  }

  // IDOR Protection
  if (order.user_id !== req.user.id && req.user.role !== "ADMIN") {
    throw new AppError("You do not have permission to view this order", 403, "FORBIDDEN");
  }

  const formattedOrder = formatOrder(order);

  res.json({
    success: true,
    data: {
      order: formattedOrder,
      ...formattedOrder,
    },
  });
});

// Cancel Order
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason = "Cancelled by user" } = req.body;

  const order = await Order.findByPk(id, {
    include: [{ model: OrderItem, as: "items" }],
  });

  if (!order) {
    throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  }

  // IDOR check
  if (order.user_id !== req.user.id && req.user.role !== "ADMIN") {
    throw new AppError("You are not authorized to cancel this order", 403, "FORBIDDEN");
  }

  // State Machine Validation
  const validation = validateTransition(order.order_status, ORDER_STATUSES.CANCELLED, req.user.role);
  if (!validation.valid) {
    throw new AppError(validation.reason, 409, "INVALID_STATE_TRANSITION");
  }

  const transaction = await sequelize.transaction();

  try {
    await order.update(
      {
        order_status: ORDER_STATUSES.CANCELLED,
        cancellation_reason: reason,
        cancelled_at: new Date(),
      },
      { transaction }
    );

    // Release reserved inventory
    await releaseInventory(order.items, order.id, order.shop_id, transaction);

    await OrderStatusHistory.create(
      {
        order_id: order.id,
        status: ORDER_STATUSES.CANCELLED,
        changed_by_id: req.user.id,
        role: req.user.role,
        note: reason,
      },
      { transaction }
    );

    await transaction.commit();

    emitOrderEvent("order:cancelled", order);

    const formattedOrder = formatOrder(order);

    res.json({
      success: true,
      message: "Order cancelled successfully",
      data: { order: formattedOrder, ...formattedOrder },
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
});

module.exports = {
  formatOrder,
  createOrder,
  getOrders,
  getOrderById,
  cancelOrder,
};
