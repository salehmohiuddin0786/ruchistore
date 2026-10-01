const { toPaise, toRupees } = require("../utils/money");

/**
 * Pure Pricing Calculation Function
 * Server-authoritative calculation for Cart and Order creation.
 *
 * @param {Array} items - Array of { product: { price, discount_price, ... }, quantity }
 * @param {Object|null} coupon - Applied coupon object (optional)
 * @param {Object} options - { distanceKm: number, gstRate: number, freeDeliveryThreshold: number, baseDeliveryFee: number }
 * @returns {Object} Calculated totals in rupees and paise
 */
const calculateOrderPricing = (items = [], coupon = null, options = {}) => {
  const {
    distanceKm = 2.0,
    gstRate = 0.05, // 5% standard grocery GST
    freeDeliveryThreshold = 299, // Free delivery on orders above ₹299
    baseDeliveryFee = 25, // Base delivery fee ₹25
    perKmFee = 5,
  } = options;

  let subtotalPaise = 0;
  let mrpTotalPaise = 0;
  let productDiscountPaise = 0;
  const processedItems = [];

  for (const item of items) {
    const qty = Math.max(1, parseInt(item.quantity || 1, 10));
    const rawPrice = parseFloat(item.product?.price || 0);
    const rawDiscountPrice = item.product?.discount_price !== null && item.product?.discount_price !== undefined
      ? parseFloat(item.product.discount_price)
      : null;

    const pricePaise = toPaise(rawPrice);
    const effectivePricePaise = (rawDiscountPrice !== null && !isNaN(rawDiscountPrice) && rawDiscountPrice < rawPrice)
      ? toPaise(rawDiscountPrice)
      : pricePaise;

    const itemMrpPaise = pricePaise * qty;
    const itemSubtotalPaise = effectivePricePaise * qty;
    const itemSavingsPaise = itemMrpPaise - itemSubtotalPaise;

    mrpTotalPaise += itemMrpPaise;
    subtotalPaise += itemSubtotalPaise;
    productDiscountPaise += itemSavingsPaise;

    processedItems.push({
      productId: item.product?.id || item.productId,
      name: item.product?.name || "Product",
      unit: item.product?.unit || "pack",
      price: toRupees(pricePaise),
      effectivePrice: toRupees(effectivePricePaise),
      quantity: qty,
      itemTotal: toRupees(itemSubtotalPaise),
      itemSavings: toRupees(itemSavingsPaise),
    });
  }

  // Coupon Calculation
  let couponDiscountPaise = 0;
  let couponApplied = null;

  if (coupon && coupon.is_active !== false) {
    const subtotalRupees = toRupees(subtotalPaise);
    const minOrder = parseFloat(coupon.min_order_amount || 0);

    if (subtotalRupees >= minOrder) {
      if (coupon.discount_type === "PERCENTAGE" || coupon.discount_type === "percent") {
        const percent = parseFloat(coupon.discount_value || 0);
        let calcPaise = Math.round((subtotalPaise * percent) / 100);
        if (coupon.max_discount_amount) {
          const maxDiscountPaise = toPaise(coupon.max_discount_amount);
          calcPaise = Math.min(calcPaise, maxDiscountPaise);
        }
        couponDiscountPaise = calcPaise;
      } else {
        // Fixed amount
        const fixedPaise = toPaise(coupon.discount_value || 0);
        couponDiscountPaise = Math.min(subtotalPaise, fixedPaise);
      }

      couponApplied = {
        id: coupon.id,
        code: coupon.code,
        discountAmount: toRupees(couponDiscountPaise),
      };
    }
  }

  // Taxable Amount (Subtotal - Coupon Discount)
  const taxablePaise = Math.max(0, subtotalPaise - couponDiscountPaise);

  // GST Calculation
  const taxPaise = Math.round(taxablePaise * gstRate);

  // Delivery Fee Calculation (Evaluated AFTER discounts)
  const taxableRupees = toRupees(taxablePaise);
  let deliveryFeePaise = 0;
  if (taxableRupees < freeDeliveryThreshold && items.length > 0) {
    const extraDist = Math.max(0, distanceKm - 2.0);
    const extraDistFee = Math.round(extraDist * perKmFee);
    deliveryFeePaise = toPaise(baseDeliveryFee + extraDistFee);
  }

  // Total Amount
  const totalAmountPaise = taxablePaise + taxPaise + deliveryFeePaise;

  return {
    items: processedItems,
    mrpTotal: toRupees(mrpTotalPaise),
    subtotal: toRupees(subtotalPaise),
    productDiscount: toRupees(productDiscountPaise),
    couponDiscount: toRupees(couponDiscountPaise),
    coupon: couponApplied,
    taxable: toRupees(taxablePaise),
    tax: toRupees(taxPaise),
    gstRate,
    deliveryFee: toRupees(deliveryFeePaise),
    totalAmount: toRupees(totalAmountPaise),
    totalAmountPaise, // For Razorpay transactions
    freeDeliveryThreshold,
    amountNeededForFreeDelivery: taxableRupees < freeDeliveryThreshold ? toRupees(toPaise(freeDeliveryThreshold) - taxablePaise) : 0,
  };
};

module.exports = {
  calculateOrderPricing,
};
