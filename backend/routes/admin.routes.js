const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { uploadDocument } = require("../middleware/upload.middleware");

router.use(protect);
router.use(authorize("ADMIN"));

// Dashboard Stats
router.get("/dashboard", adminController.getDashboard);
router.get("/stats", adminController.getDashboard);

// Orders
router.get("/orders", adminController.getOrders);

// Users
router.get("/users", adminController.getUsers);
router.patch("/users/:id/block", adminController.toggleBlockUser);
router.put("/users/:id/block", adminController.toggleBlockUser);

// Shops
router.get("/shops", adminController.getShops);
router.patch("/shops/:id/status", adminController.updateShopStatus);
router.put("/shops/:id/status", adminController.updateShopStatus);

// Delivery Partners
router.get("/delivery-partners", adminController.getDeliveryPartners);
router.patch("/delivery-partners/:id/status", adminController.updateDeliveryPartnerStatus);
router.put("/delivery-partners/:id/status", adminController.updateDeliveryPartnerStatus);

// Categories
router.post("/categories", uploadDocument.single("image"), adminController.createCategory);
router.put("/categories/:id", uploadDocument.single("image"), adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);

// Coupons
router.get("/coupons", adminController.getCoupons);
router.post("/coupons", adminController.createCoupon);
router.delete("/coupons/:id", adminController.deleteCoupon);

// Banners
router.get("/banners", adminController.getBanners);
router.post("/banners", uploadDocument.single("image"), adminController.createBanner);
router.delete("/banners/:id", adminController.deleteBanner);

// Payments
router.get("/payments", adminController.getPayments);

// Support Grievances
router.get("/support", adminController.getSupportTickets);
router.put("/support/:id/resolve", adminController.resolveSupportTicket);

// Refunds
router.post("/refunds", adminController.processRefund);

module.exports = router;
