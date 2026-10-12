const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");
const { authLimiter, otpLimiter } = require("../middleware/rateLimit.middleware");

router.post("/send-otp", otpLimiter, authController.requestOtp);
router.post("/verify-otp", authController.verifyOtpAndLogin);
router.post("/login", authLimiter, authController.loginWithPassword);
router.post("/register", authLimiter, authController.register);
router.post("/google", authLimiter, authController.loginWithGoogle);
router.get("/me", protect, authController.getMe);
router.post("/logout", authController.logout);

module.exports = router;
