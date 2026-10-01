const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/verify", protect, paymentController.verifyPayment);
router.post("/webhook", paymentController.handleWebhook);

module.exports = router;
