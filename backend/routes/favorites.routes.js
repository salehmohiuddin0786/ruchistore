const express = require("express");
const router = express.Router();
const favoritesController = require("../controllers/favorites.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/", favoritesController.getFavorites);
router.post("/product", favoritesController.toggleFavoriteProduct);
router.post("/shop", favoritesController.toggleFavoriteShop);

module.exports = router;
