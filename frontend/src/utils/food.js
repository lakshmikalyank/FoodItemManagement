// Shared helpers for stock + expiry logic (used by Dashboard and Inventory)

export const LOW_STOCK_LIMIT = 10;
export const EXPIRING_SOON_DAYS = 7;

// Dates are stored as UTC midnight, so read the calendar date from the ISO string
// to avoid showing the wrong day in other timezones.
const toLocalDate = (value) => {
  const iso = new Date(value).toISOString().slice(0, 10);
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const daysUntilExpiry = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = toLocalDate(expiryDate);
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24));
};

export const getExpiryStatus = (expiryDate) => {
  const diff = daysUntilExpiry(expiryDate);
  if (diff < 0) return "Expired";
  if (diff <= EXPIRING_SOON_DAYS) return "Expiring Soon";
  return "Fresh";
};

export const getStockStatus = (qty) => {
  const q = Number(qty);
  if (q <= 0) return "Out of Stock";
  if (q <= LOW_STOCK_LIMIT) return "Low Stock";
  return "In Stock";
};

export const formatDate = (value) => {
  if (!value) return "—";
  return toLocalDate(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const toInputDate = (value) => new Date(value).toISOString().slice(0, 10);

export const expiryLabel = (expiryDate) => {
  const d = daysUntilExpiry(expiryDate);
  if (d < 0) return `Expired ${Math.abs(d)} day${Math.abs(d) === 1 ? "" : "s"} ago`;
  if (d === 0) return "Expires today";
  return `${d} day${d === 1 ? "" : "s"} left`;
};
