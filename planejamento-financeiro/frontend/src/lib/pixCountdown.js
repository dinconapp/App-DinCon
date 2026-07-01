export const PIX_EXPIRATION_SECONDS = 180;

export function digitsOnly(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function parseExpirationMs(value) {
  if (!value) return null;
  const normalized = typeof value === "string" && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(value) ? `${value}Z` : value;
  const parsed = Date.parse(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

export function getRemainingSeconds(expiration, now = Date.now()) {
  const expirationMs = typeof expiration === "number" ? expiration : parseExpirationMs(expiration);
  if (!expirationMs) return 0;
  return Math.max(0, Math.ceil((expirationMs - now) / 1000));
}

export function formatCountdown(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0));
  const minutes = String(Math.floor(safe / 60)).padStart(2, "0");
  const seconds = String(safe % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function isActivePixStatus(status) {
  return ["pending", "processing", "in_process"].includes(String(status ?? "").toLowerCase());
}

export function isTerminalPixStatus(status) {
  return ["paid", "approved", "rejected", "cancelled", "canceled", "expired", "refunded", "charged_back", "failed"].includes(String(status ?? "").toLowerCase());
}
