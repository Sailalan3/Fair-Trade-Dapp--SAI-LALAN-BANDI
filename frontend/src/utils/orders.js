// ─── Order Management System ───

const ORDERS_KEY = "fairtrace_orders";

export const ORDER_STATUSES = [
  { id: "pending", label: "Pending", color: "bg-amber-100 text-amber-700", icon: "⏳" },
  { id: "accepted", label: "Accepted", color: "bg-green-100 text-green-700", icon: "✅" },
  { id: "rejected", label: "Rejected", color: "bg-red-100 text-red-700", icon: "❌" },
  { id: "processing", label: "Processing", color: "bg-blue-100 text-blue-700", icon: "🔄" },
  { id: "shipped", label: "Shipped", color: "bg-purple-100 text-purple-700", icon: "🚚" },
  { id: "completed", label: "Completed", color: "bg-emerald-100 text-emerald-700", icon: "🎉" },
  { id: "cancelled", label: "Cancelled", color: "bg-gray-100 text-gray-600", icon: "🚫" },
];

export function getOrders(userEmail = null) {
  const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  if (!userEmail) return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return all
    .filter(o => o.buyerEmail === userEmail || o.sellerEmail === userEmail)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getOrderById(orderId) {
  const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  return all.find(o => o.id === orderId);
}

export function createOrder({ buyerEmail, buyerName, sellerEmail, sellerName, productId, productName, quantity, unitPrice, currency, notes }) {
  const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  const order = {
    id: `ORD-${new Date().getFullYear()}-${String(all.length + 1).padStart(4, "0")}`,
    buyerEmail,
    buyerName: buyerName || buyerEmail,
    sellerEmail,
    sellerName: sellerName || sellerEmail,
    productId: productId || "",
    productName: productName || "",
    quantity: parseInt(quantity) || 1,
    unitPrice: parseFloat(unitPrice) || 0,
    totalPrice: (parseInt(quantity) || 1) * (parseFloat(unitPrice) || 0),
    currency: currency || "GBP",
    notes: notes || "",
    status: "pending",
    statusHistory: [
      { status: "pending", timestamp: new Date().toISOString(), note: "Order created" },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.push(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
  return order;
}

export function updateOrderStatus(orderId, newStatus, note = "") {
  const all = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
  const idx = all.findIndex(o => o.id === orderId);
  if (idx === -1) return null;

  all[idx].status = newStatus;
  all[idx].updatedAt = new Date().toISOString();
  all[idx].statusHistory.push({
    status: newStatus,
    timestamp: new Date().toISOString(),
    note: note || `Status updated to ${newStatus}`,
  });

  localStorage.setItem(ORDERS_KEY, JSON.stringify(all));
  return all[idx];
}

export function getOrderStats(userEmail) {
  const orders = getOrders(userEmail);
  const asBuyer = orders.filter(o => o.buyerEmail === userEmail);
  const asSeller = orders.filter(o => o.sellerEmail === userEmail);

  return {
    total: orders.length,
    asBuyer: asBuyer.length,
    asSeller: asSeller.length,
    pending: orders.filter(o => o.status === "pending").length,
    accepted: orders.filter(o => o.status === "accepted").length,
    completed: orders.filter(o => o.status === "completed").length,
    rejected: orders.filter(o => o.status === "rejected").length,
    totalValue: orders.filter(o => o.status !== "rejected" && o.status !== "cancelled")
      .reduce((sum, o) => sum + (o.totalPrice || 0), 0),
  };
}
