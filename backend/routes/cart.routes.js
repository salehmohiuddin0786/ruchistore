const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/", cartController.getCart);
router.post("/add", cartController.addToCart);
router.put("/item/:id", cartController.updateCartItem);
router.delete("/item/:id", cartController.removeCartItem);
router.delete("/clear", cartController.clearCart);

module.exports = router;
