const express = require("express");
const router = express.Router();
const shopController = require("../controllers/shop.controller");

router.get("/", shopController.getShops);
router.get("/:id", shopController.getShopById);

module.exports = router;
