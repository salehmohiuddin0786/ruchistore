const { Op } = require("sequelize");
const { Coupon, CouponUsage, Order } = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");

// Get public coupons
const getCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  const coupons = await Coupon.findAll({
    where: {
      is_active: true,
      [Op.or]: [{ expiry_date: null }, { expiry_date: { [Op.gt]: now } }],
    },
    order: [["discount_value", "DESC"]],
  });

  res.json({
    success: true,
    data: { coupons },
  });
});

// Validate coupon against user & cart total
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartAmount, shopId } = req.body;
  if (!code) {
    throw new AppError("Coupon code is required", 400, "MISSING_COUPON_CODE");
  }

  const coupon = await Coupon.findOne({
    where: { code: code.toUpperCase().trim(), is_active: true },
  });

  if (!coupon) {
    throw new AppError("Invalid or expired coupon code", 404, "COUPON_NOT_FOUND");
  }

  const now = new Date();
  if (coupon.start_date && now < new Date(coupon.start_date)) {
    throw new AppError("Coupon is not yet active", 400, "COUPON_NOT_STARTED");
  }
  if (coupon.expiry_date && now > new Date(coupon.expiry_date)) {
    throw new AppError("Coupon has expired", 400, "COUPON_EXPIRED");
  }

  // Shop specific check
  if (coupon.shop_id && shopId && coupon.shop_id !== parseInt(shopId, 10)) {
    throw new AppError("Coupon is not valid for this shop", 400, "COUPON_SHOP_INVALID");
  }

  // Min order check
  const subtotal = parseFloat(cartAmount || 0);
  const minOrder = parseFloat(coupon.min_order_amount || 0);
  if (subtotal < minOrder) {
    throw new AppError(`Minimum order amount of ₹${minOrder} required to apply this coupon`, 400, "MIN_ORDER_NOT_MET");
  }

  // First order check
  if (coupon.is_first_order_only && req.user) {
    const existingOrdersCount = await Order.count({
      where: {
        user_id: req.user.id,
        order_status: { [Op.ne]: "CANCELLED" },
      },
    });
    if (existingOrdersCount > 0) {
      throw new AppError("This coupon is only valid on your first order", 400, "FIRST_ORDER_ONLY");
    }
  }

  // Per user usage limit
  if (coupon.per_user_limit && req.user) {
    const usageCount = await CouponUsage.count({
      where: { coupon_id: coupon.id, user_id: req.user.id },
    });
    if (usageCount >= coupon.per_user_limit) {
      throw new AppError("You have reached the maximum usage limit for this coupon", 400, "USAGE_LIMIT_REACHED");
    }
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discount_type === "PERCENTAGE") {
    discountAmount = (subtotal * parseFloat(coupon.discount_value)) / 100;
    if (coupon.max_discount_amount) {
      discountAmount = Math.min(discountAmount, parseFloat(coupon.max_discount_amount));
    }
  } else {
    discountAmount = Math.min(subtotal, parseFloat(coupon.discount_value));
  }

  res.json({
    success: true,
    message: `Coupon '${coupon.code}' applied successfully!`,
    data: {
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        discountAmount: Math.round(discountAmount * 100) / 100,
      },
    },
  });
});

module.exports = {
  getCoupons,
  validateCoupon,
};
