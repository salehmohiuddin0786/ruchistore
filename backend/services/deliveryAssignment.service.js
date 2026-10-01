const { Op } = require("sequelize");
const { DeliveryPartner, DeliveryAssignment, Order, Shop, User, Notification } = require("../models");
const { getIO, emitOrderEvent } = require("../sockets/socketHandler");
const { ORDER_STATUSES } = require("./orderStateMachine");

/**
 * Calculates Haversine distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Initiates or cascades delivery partner assignment
 */
const assignNextDeliveryPartner = async (orderId) => {
  try {
    const order = await Order.findByPk(orderId, {
      include: [
        { model: Shop, as: "shop" },
        { model: User, as: "customer" },
      ],
    });

    if (!order || order.order_status !== ORDER_STATUSES.READY_FOR_PICKUP) {
      return null;
    }

    // Find partners who have already been offered this order
    const previousAssignments = await DeliveryAssignment.findAll({
      where: { order_id: orderId },
      attributes: ["delivery_partner_id"],
    });
    const excludedPartnerIds = previousAssignments.map((a) => a.delivery_partner_id);

    // Find online, approved partners
    const partners = await DeliveryPartner.findAll({
      where: {
        is_online: true,
        is_approved: true,
        status: "APPROVED",
        id: { [Op.notIn]: excludedPartnerIds.length > 0 ? excludedPartnerIds : [0] },
      },
      include: [{ model: User, as: "user" }],
    });

    if (partners.length === 0) {
      console.log(`⚠️ No available partners found for Order #${orderId}`);
      // Notify Shop and Admin that partner search is in progress or exhausted
      return null;
    }

    // Sort partners by distance to shop
    const shopLat = parseFloat(order.shop?.latitude || 17.4485);
    const shopLng = parseFloat(order.shop?.longitude || 78.3908);

    const sortedPartners = partners
      .map((p) => {
        const partnerLat = parseFloat(p.current_lat || shopLat);
        const partnerLng = parseFloat(p.current_lng || shopLng);
        const distance = calculateDistance(shopLat, shopLng, partnerLat, partnerLng);
        return { partner: p, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    const selectedPartner = sortedPartners[0].partner;
    const distanceKm = sortedPartners[0].distance.toFixed(1);
    const estimatedEarning = 45.0 + Math.max(0, Math.round((sortedPartners[0].distance - 2) * 8));

    // Offer expires in 30 seconds
    const expiresAt = new Date(Date.now() + 30 * 1000);

    const assignment = await DeliveryAssignment.create({
      order_id: orderId,
      delivery_partner_id: selectedPartner.id,
      status: "OFFERED",
      offered_at: new Date(),
      expires_at: expiresAt,
    });

    const io = getIO();
    if (io) {
      const payload = {
        assignmentId: assignment.id,
        orderId: order.id,
        orderNumber: order.order_number,
        shopName: order.shop?.name || "Ruchi Store Partner",
        shopAddress: order.shop?.address,
        distance: `${distanceKm} km`,
        earning: `₹${estimatedEarning}`,
        expiresAt: expiresAt.toISOString(),
        timeoutSeconds: 30,
      };

      io.to(`delivery:${selectedPartner.id}`).emit("delivery:new_request", payload);
      console.log(`🚴 Sent delivery request to partner #${selectedPartner.id} for Order #${orderId}`);
    }

    return assignment;
  } catch (error) {
    console.error("Error in assignNextDeliveryPartner:", error);
    return null;
  }
};

/**
 * Handles Delivery Partner Acceptance
 */
const acceptDeliveryOffer = async (assignmentId, partnerId) => {
  const now = new Date();

  // Conditional update ensures only valid, unexpired offers are accepted
  const [affectedRows] = await DeliveryAssignment.update(
    {
      status: "ACCEPTED",
      accepted_at: now,
    },
    {
      where: {
        id: assignmentId,
        delivery_partner_id: partnerId,
        status: "OFFERED",
        expires_at: { [Op.gt]: now },
      },
    }
  );

  if (affectedRows === 0) {
    return { success: false, message: "Delivery request expired or already accepted by another partner" };
  }

  const assignment = await DeliveryAssignment.findByPk(assignmentId);
  const order = await Order.findByPk(assignment.order_id);

  if (order) {
    await order.update({
      delivery_partner_id: partnerId,
      order_status: ORDER_STATUSES.ASSIGNED,
    });

    emitOrderEvent("order:assigned", order);
  }

  return { success: true, assignment, order };
};

/**
 * Handles Delivery Partner Rejection
 */
const rejectDeliveryOffer = async (assignmentId, partnerId) => {
  const assignment = await DeliveryAssignment.findOne({
    where: { id: assignmentId, delivery_partner_id: partnerId, status: "OFFERED" },
  });

  if (assignment) {
    await assignment.update({
      status: "REJECTED",
      rejected_at: new Date(),
    });

    // Cascade to next partner immediately
    setTimeout(() => {
      assignNextDeliveryPartner(assignment.order_id);
    }, 500);

    return { success: true };
  }

  return { success: false, message: "Offer not found or already closed" };
};

module.exports = {
  calculateDistance,
  assignNextDeliveryPartner,
  acceptDeliveryOffer,
  rejectDeliveryOffer,
};
