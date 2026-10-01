const express = require("express");
const router = express.Router();
const supportController = require("../controllers/support.controller");
const { protect } = require("../middleware/auth.middleware");
const { uploadDocument } = require("../middleware/upload.middleware");

router.use(protect);

router.post("/", uploadDocument.single("attachment"), supportController.createTicket);
router.get("/", supportController.getTickets);
router.get("/:id/messages", supportController.getTicketMessages);
router.post("/:id/messages", uploadDocument.single("attachment"), supportController.sendMessage);

module.exports = router;
