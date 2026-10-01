/**
 * Money Utility
 * Ensures all monetary calculations avoid floating-point inaccuracy.
 * Operates internally in integer paise (1 INR = 100 paise).
 */

const toPaise = (amount) => {
  if (amount === undefined || amount === null || isNaN(amount)) return 0;
  return Math.round(Number(amount) * 100);
};

const toRupees = (paise) => {
  if (paise === undefined || paise === null || isNaN(paise)) return 0;
  return Math.round(Number(paise)) / 100;
};

const formatCurrency = (amount) => {
  const num = typeof amount === "number" ? amount : parseFloat(amount || 0);
  return `₹${num.toFixed(2)}`;
};

module.exports = {
  toPaise,
  toRupees,
  formatCurrency,
};
