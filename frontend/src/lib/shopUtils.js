/**
 * Robust check to determine if a grocery partner shop is currently active & open for orders.
 * Handles MySQL boolean/tinyint (0/1), strings ("0"/"1"/"true"/"false"), and status checks.
 */
export const isShopOpen = (shop) => {
  if (!shop) return false;

  // If status is present and not approved, it's not open
  if (shop.status && shop.status !== "APPROVED") {
    return false;
  }

  const raw = shop.is_open !== undefined ? shop.is_open : shop.isOpen;

  if (raw === false || raw === 0 || raw === "0" || raw === "false") {
    return false;
  }

  if (raw === true || raw === 1 || raw === "1" || raw === "true") {
    return true;
  }

  return Boolean(raw);
};
