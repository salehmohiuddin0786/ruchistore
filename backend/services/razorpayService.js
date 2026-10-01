const crypto = require("crypto");
let Razorpay;
try {
  Razorpay = require("razorpay");
} catch (e) {
  Razorpay = null;
}

const keyId = process.env.RAZORPAY_KEY_ID || "";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "";

let instance = null;
if (Razorpay && keyId && keySecret && !keyId.includes("placeholder")) {
  instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

/**
 * Creates Razorpay Order
 * @param {number} amountPaise
 * @param {string} receipt
 * @returns {Promise<Object>}
 */
const createRazorpayOrder = async (amountPaise, receipt) => {
  if (!instance) {
    // Return mock order for testing/development if keys aren't configured
    return {
      id: `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      amount: amountPaise,
      currency: "INR",
      receipt,
      status: "created",
      is_mock: true,
    };
  }

  const options = {
    amount: amountPaise,
    currency: "INR",
    receipt,
  };

  return await instance.orders.create(options);
};

/**
 * Verifies Razorpay Payment Signature
 */
const verifyPaymentSignature = (orderId, paymentId, signature) => {
  if (!keySecret || keySecret.includes("placeholder")) {
    return true; // Dev mode fallback
  }

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return expectedSignature === signature;
};

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  isRazorpayConfigured: !!instance,
};
