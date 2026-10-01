const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { User, Order, DeliveryPartner, DeliveryLocation } = require("../models");

let io = null;
const lastGpsWriteMap = new Map(); // Throttle DB writes: partnerId -> lastTimestamp

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005",
        "https://ruchistore.in",
        "https://ruchistore.com",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) {
        // Allow unauthenticated connection for guest tracking with token in query if needed, or reject
        return next(new Error("Authentication token required"));
      }

      const secret = process.env.JWT_SECRET || "ruchistore_super_secret_jwt_key_2026_xyz";
      const decoded = jwt.verify(token, secret);
      const user = await User.findByPk(decoded.id);

      if (!user || user.is_blocked) {
        return next(new Error("User account invalid or suspended"));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid token authentication: " + err.message));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`🔌 Socket connected: User #${user.id} (${user.role}) - Socket ID: ${socket.id}`);

    // Join personal user room
    socket.join(`user:${user.id}`);

    // Role-specific room subscriptions
    if (user.role === "ADMIN") {
      socket.join("admin");
    }

    if (user.role === "SHOP_OWNER") {
      // Find shops owned by user and join shop rooms
      User.findByPk(user.id, { include: ["ownedShops"] }).then((u) => {
        if (u?.ownedShops) {
          u.ownedShops.forEach((s) => {
            socket.join(`shop:${s.id}`);
            console.log(`🏪 Shop Owner #${user.id} joined room shop:${s.id}`);
          });
        }
      });
    }

    if (user.role === "DELIVERY_PARTNER") {
      DeliveryPartner.findOne({ where: { user_id: user.id } }).then((dp) => {
        if (dp) {
          socket.deliveryPartnerId = dp.id;
          socket.join(`delivery:${dp.id}`);
          console.log(`🚴 Delivery Partner #${dp.id} joined room delivery:${dp.id}`);
        }
      });
    }

    // Join specific order room (for customers, assigned delivery partner, or shop owner)
    socket.on("order:join", async (orderId) => {
      try {
        const order = await Order.findByPk(orderId);
        if (!order) return;

        // Verify authorization
        let canJoin = false;
        if (user.role === "ADMIN") canJoin = true;
        if (order.user_id === user.id) canJoin = true;
        if (order.delivery_partner_id === socket.deliveryPartnerId) canJoin = true;

        if (canJoin) {
          socket.join(`order:${orderId}`);
          console.log(`📦 User #${user.id} joined order:${orderId}`);
        }
      } catch (e) {
        console.error("Error joining order room:", e.message);
      }
    });

    socket.on("order:leave", (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    // Delivery Partner Real-time GPS stream
    socket.on("delivery:location", async (payload) => {
      try {
        if (user.role !== "DELIVERY_PARTNER") return;
        const { orderId, latitude, longitude, accuracy, heading, speed } = payload;
        const partnerId = socket.deliveryPartnerId;

        if (!partnerId || !latitude || !longitude) return;

        const locationData = {
          orderId,
          deliveryPartnerId: partnerId,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          accuracy: accuracy || null,
          heading: heading || null,
          speed: speed || null,
          timestamp: Date.now(),
        };

        // Broadcast immediately to live order room (instant UI update for customer)
        if (orderId) {
          io.to(`order:${orderId}`).emit("delivery:location_update", locationData);
        }
        // Broadcast to admin room
        io.to("admin").emit("delivery:partner_location", locationData);

        // Throttle database persistence: Store sampled location at most once every 30 seconds
        const now = Date.now();
        const lastWrite = lastGpsWriteMap.get(partnerId) || 0;
        if (now - lastWrite > 30000) {
          lastGpsWriteMap.set(partnerId, now);
          DeliveryPartner.update(
            { current_lat: latitude, current_lng: longitude },
            { where: { id: partnerId } }
          ).catch(() => {});

          DeliveryLocation.create({
            delivery_partner_id: partnerId,
            order_id: orderId || null,
            latitude,
            longitude,
            accuracy,
            heading,
            speed,
          }).catch(() => {});
        }
      } catch (err) {
        console.error("GPS location event error:", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: User #${user.id}`);
    });
  });

  return io;
};

const getIO = () => {
  return io;
};

/**
 * Emit Order Lifecycle Events to Rooms
 */
const emitOrderEvent = (eventName, order) => {
  if (!io) return;

  const payload = {
    orderId: order.id,
    orderNumber: order.order_number,
    status: order.order_status,
    order,
    timestamp: new Date(),
  };

  // Broadcast to customer room
  io.to(`user:${order.user_id}`).emit(eventName, payload);
  // Broadcast to specific order room
  io.to(`order:${order.id}`).emit(eventName, payload);
  // Broadcast to shop room
  io.to(`shop:${order.shop_id}`).emit(eventName, payload);
  // Broadcast to admin
  io.to("admin").emit(eventName, payload);

  // If assigned to a partner, broadcast to partner
  if (order.delivery_partner_id) {
    io.to(`delivery:${order.delivery_partner_id}`).emit(eventName, payload);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitOrderEvent,
};
