const express = require("express");
const router = express.Router();
const reviewsController = require("../controllers/reviews.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/product", protect, reviewsController.addProductReview);
router.post("/shop", protect, reviewsController.addShopReview);

module.exports = router;
