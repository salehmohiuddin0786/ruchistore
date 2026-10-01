const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");
const { uploadDocument } = require("../middleware/upload.middleware");

router.get("/profile", protect, userController.getProfile);
router.put("/profile", protect, uploadDocument.single("profile_image"), userController.updateProfile);
router.post("/change-password", protect, userController.changePassword);

module.exports = router;
