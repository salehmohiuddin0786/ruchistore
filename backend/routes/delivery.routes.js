const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/delivery.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

router.use(protect);
router.use(authorize("DELIVERY_PARTNER", "ADMIN"));

router.get("/dashboard", deliveryController.getDashboard);
router.get("/profile", deliveryController.getProfile);
router.put("/profile", deliveryController.updateProfile);
router.put("/status", deliveryController.updateStatus);
router.post("/status", deliveryController.updateStatus);
router.post("/toggle-online", deliveryController.toggleOnline);
router.get("/orders", deliveryController.getOrders);
router.get("/orders/:id", deliveryController.getOrderById);
router.put("/orders/:id/status", deliveryController.updateOrderStatus);
router.post("/assignments/:id/accept", deliveryController.acceptAssignmentById);
router.post("/assignments/:id/reject", deliveryController.rejectAssignmentById);
router.post("/accept", deliveryController.acceptOffer);
router.post("/reject", deliveryController.rejectOffer);
router.get("/earnings", deliveryController.getEarnings);

module.exports = router;
