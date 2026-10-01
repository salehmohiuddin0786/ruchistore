const express = require("express");
const router = express.Router();
const couponController = require("../controllers/coupon.controller");
const adminController = require("../controllers/admin.controller");
const { protect, optionalAuth, authorize } = require("../middleware/auth.middleware");

// Public endpoints
router.get("/", couponController.getCoupons);
router.post("/validate", optionalAuth, couponController.validateCoupon);

// Protected endpoints for shop owners & admins
router.post("/", protect, authorize("ADMIN", "SHOP_OWNER"), adminController.createCoupon);
router.delete("/:id", protect, authorize("ADMIN", "SHOP_OWNER"), adminController.deleteCoupon);

module.exports = router;
