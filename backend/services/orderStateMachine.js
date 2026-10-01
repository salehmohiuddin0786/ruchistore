/**
 * Order State Machine
 * Defines valid order statuses, allowed transitions, and role-based permissions.
 */

const ORDER_STATUSES = {
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  PACKING: "PACKING",
  READY_FOR_PICKUP: "READY_FOR_PICKUP",
  ASSIGNED: "ASSIGNED",
  PICKED_UP: "PICKED_UP",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED",
};

const ALLOWED_TRANSITIONS = {
  [ORDER_STATUSES.PLACED]: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.CONFIRMED]: [ORDER_STATUSES.PACKING, ORDER_STATUSES.READY_FOR_PICKUP, ORDER_STATUSES.ASSIGNED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PACKING]: [ORDER_STATUSES.READY_FOR_PICKUP, ORDER_STATUSES.ASSIGNED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.READY_FOR_PICKUP]: [ORDER_STATUSES.ASSIGNED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.ASSIGNED]: [ORDER_STATUSES.PICKED_UP, ORDER_STATUSES.ASSIGNED, ORDER_STATUSES.READY_FOR_PICKUP, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PICKED_UP]: [ORDER_STATUSES.OUT_FOR_DELIVERY],
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.DELIVERED]: [ORDER_STATUSES.REFUNDED],
  [ORDER_STATUSES.CANCELLED]: [ORDER_STATUSES.REFUNDED],
  [ORDER_STATUSES.REFUNDED]: [],
};

const ROLE_PERMISSIONS = {
  [ORDER_STATUSES.CONFIRMED]: ["SHOP_OWNER", "ADMIN"],
  [ORDER_STATUSES.PACKING]: ["SHOP_OWNER", "ADMIN"],
  [ORDER_STATUSES.READY_FOR_PICKUP]: ["SHOP_OWNER", "ADMIN"],
  [ORDER_STATUSES.ASSIGNED]: ["SYSTEM", "DELIVERY_PARTNER", "ADMIN", "SHOP_OWNER"],
  [ORDER_STATUSES.PICKED_UP]: ["DELIVERY_PARTNER", "ADMIN"],
  [ORDER_STATUSES.OUT_FOR_DELIVERY]: ["DELIVERY_PARTNER", "ADMIN"],
  [ORDER_STATUSES.DELIVERED]: ["DELIVERY_PARTNER", "ADMIN"],
  [ORDER_STATUSES.CANCELLED]: ["CUSTOMER", "SHOP_OWNER", "ADMIN", "SYSTEM"],
  [ORDER_STATUSES.REFUNDED]: ["ADMIN"],
};

/**
 * Validates whether a state transition is legal and permitted for the role.
 *
 * @param {string} currentStatus
 * @param {string} targetStatus
 * @param {string} role
 * @returns {{ valid: boolean, reason?: string }}
 */
const validateTransition = (currentStatus, targetStatus, role = "ADMIN") => {
  if (!currentStatus || !targetStatus) {
    return { valid: false, reason: "Current and target status must be provided" };
  }

  if (currentStatus === targetStatus) {
    return { valid: false, reason: `Order is already in state '${currentStatus}'` };
  }

  const validNextStates = ALLOWED_TRANSITIONS[currentStatus];
  if (!validNextStates || !validNextStates.includes(targetStatus)) {
    return {
      valid: false,
      reason: `Illegal state transition from '${currentStatus}' to '${targetStatus}'`,
    };
  }

  // Special rule: Customer can ONLY cancel if status is PLACED
  if (role === "CUSTOMER" && targetStatus === ORDER_STATUSES.CANCELLED && currentStatus !== ORDER_STATUSES.PLACED) {
    return {
      valid: false,
      reason: "Customers can only cancel orders while in 'PLACED' status",
    };
  }

  // Check general role permission
  const allowedRoles = ROLE_PERMISSIONS[targetStatus];
  if (allowedRoles && !allowedRoles.includes(role)) {
    return {
      valid: false,
      reason: `Role '${role}' is not permitted to transition order to '${targetStatus}'`,
    };
  }

  return { valid: true };
};

module.exports = {
  ORDER_STATUSES,
  ALLOWED_TRANSITIONS,
  ROLE_PERMISSIONS,
  validateTransition,
};
