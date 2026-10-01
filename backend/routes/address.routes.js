const express = require("express");
const router = express.Router();
const addressController = require("../controllers/address.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/", addressController.getAddresses);
router.post("/", addressController.addAddress);
router.put("/:id", addressController.updateAddress);
router.patch("/:id/default", addressController.setDefaultAddress);
router.delete("/:id", addressController.deleteAddress);

module.exports = router;
