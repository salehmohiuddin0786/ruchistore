const assert = require("assert");
const { calculateOrderPricing } = require("../services/pricingService");
const { validateTransition, ORDER_STATUSES } = require("../services/orderStateMachine");
const { toPaise, toRupees } = require("../utils/money");

console.log("🧪 Starting Automated Unit Tests...\n");

// --- TEST 1: Money Utility ---
console.log("Test 1: Money utility floating point precision");
assert.strictEqual(toPaise(0.1 + 0.2), 30, "0.1 + 0.2 should equal 30 paise");
assert.strictEqual(toRupees(150), 1.5, "150 paise should equal 1.5 rupees");
assert.strictEqual(toPaise(120.5), 12050);
console.log("✅ Passed: Money utility");

// --- TEST 2: Pure Pricing Calculation ---
console.log("\nTest 2: Server-authoritative Pricing Service");
const sampleItems = [
  {
    product: { id: 1, name: "Apple", price: 150.0, discount_price: 120.0 },
    quantity: 2,
  },
  {
    product: { id: 2, name: "Milk", price: 68.0, discount_price: 65.0 },
    quantity: 1,
  },
];
// Subtotal: (120 * 2) + 65 = 305
// Mrp: (150 * 2) + 68 = 368
// Product discount: 63
// Subtotal >= 299, so delivery fee = 0
// Taxable = 305. 5% GST = 15.25
// Total = 305 + 15.25 = 320.25
const pricing1 = calculateOrderPricing(sampleItems);
assert.strictEqual(pricing1.subtotal, 305.0);
assert.strictEqual(pricing1.productDiscount, 63.0);
assert.strictEqual(pricing1.deliveryFee, 0.0);
assert.strictEqual(pricing1.tax, 15.25);
assert.strictEqual(pricing1.totalAmount, 320.25);
console.log("✅ Passed: Subtotal, product discounts, free delivery threshold, and tax");

// --- TEST 3: Delivery fee rule evaluated AFTER discounts ---
console.log("\nTest 3: Delivery fee rule under threshold");
const smallCart = [
  {
    product: { id: 1, name: "Bread", price: 50.0, discount_price: 45.0 },
    quantity: 2,
  },
];
// Subtotal: 90 (< 299). Base delivery fee = 25
const pricingSmall = calculateOrderPricing(smallCart);
assert.strictEqual(pricingSmall.subtotal, 90.0);
assert.strictEqual(pricingSmall.deliveryFee, 25.0);
console.log("✅ Passed: Base delivery fee correctly applied when below threshold");

// --- TEST 4: Coupon Discount ---
console.log("\nTest 4: Coupon application");
const couponFixed = {
  id: 1,
  code: "SAVE50",
  discount_type: "FIXED",
  discount_value: 50.0,
  min_order_amount: 200.0,
  is_active: true,
};
const pricingWithCoupon = calculateOrderPricing(sampleItems, couponFixed);
// Subtotal: 305 - 50 = 255 taxable
// Taxable 255 < 299, so delivery fee 25 applies after discount!
// GST 5% on 255 = 12.75
// Total = 255 + 12.75 + 25 = 292.75
assert.strictEqual(pricingWithCoupon.couponDiscount, 50.0);
assert.strictEqual(pricingWithCoupon.taxable, 255.0);
assert.strictEqual(pricingWithCoupon.deliveryFee, 25.0);
assert.strictEqual(pricingWithCoupon.totalAmount, 292.75);
console.log("✅ Passed: Coupon discount & post-discount delivery fee calculation");

// --- TEST 5: Order State Machine ---
console.log("\nTest 5: Order State Machine legal transitions");
assert.strictEqual(validateTransition(ORDER_STATUSES.PLACED, ORDER_STATUSES.CONFIRMED, "SHOP_OWNER").valid, true);
assert.strictEqual(validateTransition(ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.PACKING, "SHOP_OWNER").valid, true);
assert.strictEqual(validateTransition(ORDER_STATUSES.PACKING, ORDER_STATUSES.READY_FOR_PICKUP, "SHOP_OWNER").valid, true);
assert.strictEqual(validateTransition(ORDER_STATUSES.READY_FOR_PICKUP, ORDER_STATUSES.ASSIGNED, "SYSTEM").valid, true);
assert.strictEqual(validateTransition(ORDER_STATUSES.ASSIGNED, ORDER_STATUSES.PICKED_UP, "DELIVERY_PARTNER").valid, true);
assert.strictEqual(validateTransition(ORDER_STATUSES.PICKED_UP, ORDER_STATUSES.OUT_FOR_DELIVERY, "DELIVERY_PARTNER").valid, true);
assert.strictEqual(validateTransition(ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.DELIVERED, "DELIVERY_PARTNER").valid, true);
console.log("✅ Passed: Happy path forward transitions");

console.log("\nTest 6: Order State Machine illegal transitions & role restrictions");
// Illegal skip: PLACED directly to DELIVERED
const illegalTransition = validateTransition(ORDER_STATUSES.PLACED, ORDER_STATUSES.DELIVERED, "CUSTOMER");
assert.strictEqual(illegalTransition.valid, false);

// Role denial: CUSTOMER cannot mark order as DELIVERED
const unauthorizedRole = validateTransition(ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.DELIVERED, "CUSTOMER");
assert.strictEqual(unauthorizedRole.valid, false);

// Customer cannot cancel if order is already OUT_FOR_DELIVERY
const lateCancellation = validateTransition(ORDER_STATUSES.OUT_FOR_DELIVERY, ORDER_STATUSES.CANCELLED, "CUSTOMER");
assert.strictEqual(lateCancellation.valid, false);
console.log("✅ Passed: Illegal transition rejection & role protection");

console.log("\n🎉 ALL UNIT TESTS PASSED SUCCESSFULLY!\n");
process.exit(0);
