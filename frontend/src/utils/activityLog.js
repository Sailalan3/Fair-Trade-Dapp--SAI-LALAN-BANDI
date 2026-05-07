// ─── Activity Logs & Login History ───

const LOG_KEY = "fairtrace_activity_logs";
const LOGIN_KEY = "fairtrace_login_history";

export function addActivityLog(entry) {
  const logs = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  logs.push({
    id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  });
  // Keep last 500 entries
  if (logs.length > 500) logs.splice(0, logs.length - 500);
  localStorage.setItem(LOG_KEY, JSON.stringify(logs));
}

export function getActivityLogs(userEmail, limit = 50) {
  const logs = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  const filtered = userEmail ? logs.filter(l => l.userEmail === userEmail) : logs;
  return filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
}

export function addLoginRecord(userEmail, success = true, method = "email") {
  const history = JSON.parse(localStorage.getItem(LOGIN_KEY) || "[]");
  history.push({
    id: `LOGIN-${Date.now()}`,
    userEmail,
    success,
    method,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
  });
  if (history.length > 200) history.splice(0, history.length - 200);
  localStorage.setItem(LOGIN_KEY, JSON.stringify(history));
}

export function getLoginHistory(userEmail, limit = 20) {
  const history = JSON.parse(localStorage.getItem(LOGIN_KEY) || "[]");
  return history
    .filter(h => h.userEmail === userEmail)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

// Activity types for structured logging
export const ACTIVITY_TYPES = {
  LOGIN: "login",
  LOGOUT: "logout",
  REGISTER: "register",
  PRODUCT_CREATED: "product_created",
  PRODUCT_TRANSFERRED: "product_transferred",
  PRODUCT_SOLD: "product_sold",
  PRODUCT_PROCESSED: "product_processed",
  DELIVERY_CREATED: "delivery_created",
  DELIVERY_UPDATED: "delivery_updated",
  ORDER_CREATED: "order_created",
  ORDER_UPDATED: "order_updated",
  PROFILE_UPDATED: "profile_updated",
  PASSWORD_CHANGED: "password_changed",
  DOCUMENT_UPLOADED: "document_uploaded",
  PRODUCT_ACCEPTED: "product_accepted",
  PRODUCT_REJECTED: "product_rejected",
};

export const ACTIVITY_ICONS = {
  login: "🔑",
  logout: "🚪",
  register: "📝",
  product_created: "📦",
  product_transferred: "🔄",
  product_sold: "💰",
  product_processed: "🏭",
  delivery_created: "🚚",
  delivery_updated: "📍",
  order_created: "📋",
  order_updated: "✏️",
  profile_updated: "👤",
  password_changed: "🔒",
  document_uploaded: "📄",
  product_accepted: "✅",
  product_rejected: "❌",
};
