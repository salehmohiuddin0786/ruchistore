const { Op } = require("sequelize");
const { DeliveryAssignment, Order } = require("../models");
const { assignNextDeliveryPartner } = require("../services/deliveryAssignment.service");
const { ORDER_STATUSES } = require("../services/orderStateMachine");

let intervalId = null;

const startAssignmentMonitor = () => {
  if (intervalId) return;

  // Run every 5 seconds to detect expired delivery partner offers
  intervalId = setInterval(async () => {
    try {
      const now = new Date();
      const expiredOffers = await DeliveryAssignment.findAll({
        where: {
          status: "OFFERED",
          expires_at: { [Op.lt]: now },
        },
      });

      for (const offer of expiredOffers) {
        await offer.update({ status: "EXPIRED" });
        console.log(`⏰ Assignment #${offer.id} for Order #${offer.order_id} expired. Re-routing...`);

        // Check if order still needs delivery partner
        const order = await Order.findByPk(offer.order_id);
        if (order && order.order_status === ORDER_STATUSES.READY_FOR_PICKUP && !order.delivery_partner_id) {
          await assignNextDeliveryPartner(order.id);
        }
      }
    } catch (err) {
      console.error("Error in assignment monitor job:", err.message);
    }
  }, 5000);

  console.log("⏱️ Delivery assignment monitor job started (interval: 5s)");
};

const stopAssignmentMonitor = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

module.exports = {
  startAssignmentMonitor,
  stopAssignmentMonitor,
};
