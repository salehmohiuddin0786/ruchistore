const express = require("express");
const router = express.Router();
const shopOwnerController = require("../controllers/shopOwner.controller");
const { protect, authorize } = require("../middleware/auth.middleware");
const { uploadProduct, uploadShop } = require("../middleware/upload.middleware");

router.use(protect);
router.use(authorize("SHOP_OWNER", "ADMIN"));

// Dashboard & Orders
router.get("/dashboard", shopOwnerController.getDashboard);
router.get("/stats", shopOwnerController.getDashboard);
router.get("/orders", shopOwnerController.getOrders);
router.put("/orders/:id/status", shopOwnerController.updateOrderStatus);
router.get("/delivery-partners", shopOwnerController.getDeliveryPartners);
router.post("/orders/:id/assign-delivery", shopOwnerController.assignDeliveryPartner);
router.put("/orders/:id/assign-delivery", shopOwnerController.assignDeliveryPartner);

// Products
router.get("/products", shopOwnerController.getProducts);
router.post("/products/bulk-import", shopOwnerController.bulkImportProducts);
router.post("/products", uploadProduct.single("image"), shopOwnerController.createProduct);
router.put("/products/:id", uploadProduct.single("image"), shopOwnerController.updateProduct);
router.delete("/products/:id", shopOwnerController.deleteProduct);

// Inventory
router.get("/inventory", shopOwnerController.getInventory);
router.post("/inventory/bulk-update", shopOwnerController.bulkUpdateStock);
router.post("/inventory/update-stock", shopOwnerController.updateStock);
router.put("/inventory/:id", shopOwnerController.updateStockById);
router.patch("/inventory/:id", shopOwnerController.updateStockById);

// Shop profile & earnings
router.get("/shop", shopOwnerController.getShopSettings);
router.put("/shop/status", shopOwnerController.updateShopStatus);
router.patch("/shop/status", shopOwnerController.updateShopStatus);
router.put(
  "/shop",
  uploadShop.fields([
    { name: "logo", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  shopOwnerController.updateShopSettings
);
router.get("/earnings", shopOwnerController.getEarnings);
router.post("/payout-request", shopOwnerController.requestPayout);
router.post("/upload-image", uploadShop.single("image"), shopOwnerController.uploadImage);

module.exports = router;
