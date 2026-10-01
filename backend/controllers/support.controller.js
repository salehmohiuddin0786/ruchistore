const { SupportTicket, SupportMessage, User } = require("../models");
const { AppError, asyncHandler } = require("../middleware/error.middleware");

// Create support ticket
const createTicket = asyncHandler(async (req, res) => {
  const { subject, message, orderId, priority = "MEDIUM" } = req.body;

  if (!subject || !message) {
    throw new AppError("Subject and message are required", 400, "MISSING_FIELDS");
  }

  const ticket = await SupportTicket.create({
    user_id: req.user.id,
    order_id: orderId || null,
    subject,
    priority,
    status: "OPEN",
  });

  const supportMessage = await SupportMessage.create({
    ticket_id: ticket.id,
    sender_id: req.user.id,
    message,
    attachment: req.file ? `/uploads/documents/${req.file.filename}` : null,
  });

  res.status(201).json({
    success: true,
    message: "Support ticket created successfully",
    data: { ticket, initialMessage: supportMessage },
  });
});

// Get user's support tickets
const getTickets = asyncHandler(async (req, res) => {
  const whereClause = req.user.role === "ADMIN" ? {} : { user_id: req.user.id };

  const tickets = await SupportTicket.findAll({
    where: whereClause,
    include: [{ model: User, as: "user", attributes: ["name", "email", "phone"] }],
    order: [["created_at", "DESC"]],
  });

  res.json({
    success: true,
    data: { tickets },
  });
});

// Get ticket conversation
const getTicketMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const ticket = await SupportTicket.findByPk(id);

  if (!ticket) throw new AppError("Ticket not found", 404, "NOT_FOUND");
  if (ticket.user_id !== req.user.id && req.user.role !== "ADMIN") {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const messages = await SupportMessage.findAll({
    where: { ticket_id: id },
    order: [["created_at", "ASC"]],
  });

  res.json({
    success: true,
    data: { ticket, messages },
  });
});

// Send message in ticket
const sendMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) throw new AppError("Message content is required", 400, "MISSING_MESSAGE");

  const ticket = await SupportTicket.findByPk(id);
  if (!ticket) throw new AppError("Ticket not found", 404, "NOT_FOUND");

  if (ticket.user_id !== req.user.id && req.user.role !== "ADMIN") {
    throw new AppError("Forbidden", 403, "FORBIDDEN");
  }

  const supportMessage = await SupportMessage.create({
    ticket_id: id,
    sender_id: req.user.id,
    message,
    attachment: req.file ? `/uploads/documents/${req.file.filename}` : null,
  });

  res.status(201).json({
    success: true,
    message: "Message sent",
    data: { message: supportMessage },
  });
});

module.exports = {
  createTicket,
  getTickets,
  getTicketMessages,
  sendMessage,
};
