const { Payment, Order } = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");
const { verifyPaymentSignature } = require("../services/razorpayService");
const { emitOrderEvent } = require("../sockets/socketHandler");

// Verify Razorpay payment signature
const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  if (!orderId || !razorpayOrderId || !razorpayPaymentId) {
    throw new AppError("Payment details missing", 400, "MISSING_PAYMENT_DATA");
  }

  const order = await Order.findByPk(orderId);
  if (!order) {
    throw new AppError("Order not found", 404, "ORDER_NOT_FOUND");
  }

  // IDOR check
  if (order.user_id !== req.user.id && req.user.role !== "ADMIN") {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
  if (!isValid) {
    throw new AppError("Payment signature verification failed", 400, "INVALID_SIGNATURE");
  }

  // Update Payment record
  let payment = await Payment.findOne({ where: { order_id: order.id } });
  if (payment) {
    await payment.update({
      gateway_payment_id: razorpayPaymentId,
      signature: razorpaySignature,
      status: "SUCCESS",
    });
  } else {
    payment = await Payment.create({
      order_id: order.id,
      user_id: req.user.id,
      amount: order.total_amount,
      payment_method: "RAZORPAY",
      gateway_name: "RAZORPAY",
      gateway_order_id: razorpayOrderId,
      gateway_payment_id: razorpayPaymentId,
      signature: razorpaySignature,
      status: "SUCCESS",
    });
  }

  // Update Order payment status
  await order.update({ payment_status: "PAID" });

  emitOrderEvent("order:paid", order);

  res.json({
    success: true,
    message: "Payment verified successfully!",
    data: { order, payment },
  });
});

// Razorpay Webhook Endpoint
const handleWebhook = asyncHandler(async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  // If secret configured, verify webhook signature
  if (webhookSecret && signature) {
    const crypto = require("crypto");
    const expected = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    if (expected !== signature) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }
  }

  const event = req.body.event;
  const payload = req.body.payload;

  if (event === "payment.captured") {
    const paymentEntity = payload.payment?.entity;
    if (paymentEntity?.order_id) {
      const payment = await Payment.findOne({
        where: { gateway_order_id: paymentEntity.order_id },
      });
      if (payment && payment.status !== "SUCCESS") {
        await payment.update({
          status: "SUCCESS",
          gateway_payment_id: paymentEntity.id,
        });
        await Order.update({ payment_status: "PAID" }, { where: { id: payment.order_id } });
      }
    }
  }

  res.json({ status: "ok" });
});

module.exports = {
  verifyPayment,
  handleWebhook,
};
