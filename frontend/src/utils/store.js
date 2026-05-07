// ─── FairTrace Data Store v3 ───
// Action-based system with ownership control, self/transfer flows, receipts, delivery tracking

import { persistNotification } from "../context/NotificationContext";
import { addActivityLog, ACTIVITY_TYPES } from "./activityLog";
import {
  syncProduct,
  syncTransaction,
  syncReceipt,
  syncDelivery,
  syncDeliveryStatus,
} from "./backendSync";

// Local helper — pulls walletAddress from session for seller/buyer fields
function _walletForEmail(email) {
  if (!email) return "";
  const users = JSON.parse(localStorage.getItem("fairtrace_users") || "[]");
  const u = users.find((x) => x.email === email);
  return (u?.walletAddress || "").toLowerCase();
}

export const CATEGORIES = [
  { id: "agriculture", label: "Agriculture", emoji: "\u2615", examples: "Coffee, Cocoa, Tea" },
  { id: "food", label: "Food", emoji: "\u{1F36B}", examples: "Chocolate, Roasted items" },
  { id: "textile", label: "Textile", emoji: "\u{1F9F5}", examples: "Wool, Recycled cloth" },
  { id: "manufacturing", label: "Manufacturing", emoji: "\u{1F3ED}", examples: "Nylon, Synthetic" },
];

export const CATEGORY_FIELDS = {
  agriculture: [
    { name: "farmerName", label: "\u{1F468}\u200D\u{1F33E} Farmer Name", type: "text", required: true },
    { name: "farmLocation", label: "\u{1F4CD} Farm Location", type: "text", required: true },
    { name: "harvestDate", label: "\u{1F4C5} Harvest Date", type: "date", required: true },
    { name: "soilType", label: "\u{1F33F} Soil Type", type: "text" },
    { name: "altitude", label: "\u26F0\uFE0F Altitude (m)", type: "number" },
  ],
  food: [
    { name: "producerName", label: "\u{1F468}\u200D\u{1F373} Producer Name", type: "text", required: true },
    { name: "ingredients", label: "\u{1F4CB} Ingredients", type: "textarea" },
    { name: "processingType", label: "\u{1F3ED} Processing Type", type: "text" },
    { name: "expiryDate", label: "\u{1F4C5} Expiry Date", type: "date" },
    { name: "allergens", label: "\u26A0\uFE0F Allergens", type: "text" },
  ],
  textile: [
    { name: "manufacturerName", label: "\u{1F3ED} Manufacturer Name", type: "text", required: true },
    { name: "materialType", label: "\u{1F9F5} Material Type", type: "text", required: true },
    { name: "fabricType", label: "\u{1F455} Fabric Type", type: "text" },
    { name: "recyclingDetails", label: "\u267B\uFE0F Recycling Details", type: "textarea" },
    { name: "threadCount", label: "#\uFE0F\u20E3 Thread Count", type: "number" },
  ],
  manufacturing: [
    { name: "factoryName", label: "\u{1F3ED} Factory Name", type: "text", required: true },
    { name: "rawMaterialSource", label: "\u{1F4E6} Raw Material Source", type: "text", required: true },
    { name: "productionMethod", label: "\u2699\uFE0F Production Method", type: "text" },
    { name: "batchSize", label: "\u{1F4CA} Batch Size", type: "number" },
    { name: "qualityGrade", label: "\u2B50 Quality Grade", type: "text" },
  ],
};

// ─── ACTIONS & ROLE MAPPINGS ───

export const ACTIONS = [
  { id: "register", label: "Register Product", emoji: "\u{1F4E6}", stage: "Registered" },
  { id: "process", label: "Process Product", emoji: "\u{1F3ED}", stage: "Processed" },
  { id: "roast", label: "Roast Product", emoji: "\u{1F525}", stage: "Roasted" },
  { id: "manufacture", label: "Manufacture Product", emoji: "\u2699\uFE0F", stage: "Manufactured" },
  { id: "import", label: "Import Product", emoji: "\u{1F4E5}", stage: "Imported" },
  { id: "export", label: "Export Product", emoji: "\u{1F6A2}", stage: "Exported" },
  { id: "warehouse", label: "Warehouse Product", emoji: "\u{1F3E2}", stage: "Warehoused" },
  { id: "sell", label: "Sell / Retail", emoji: "\u{1F6D2}", stage: "Sold" },
  { id: "transfer", label: "Transfer Product", emoji: "\u{1F69A}", stage: "Transferred" },
];

// Self flow actions (no ownership change)
export const SELF_ACTIONS = [
  { id: "process", label: "Process", emoji: "\u{1F3ED}", stage: "Processed" },
  { id: "roast", label: "Roast", emoji: "\u{1F525}", stage: "Roasted" },
  { id: "manufacture", label: "Manufacture", emoji: "\u2699\uFE0F", stage: "Manufactured" },
  { id: "export", label: "Export", emoji: "\u{1F6A2}", stage: "Exported" },
  { id: "warehouse", label: "Warehouse", emoji: "\u{1F3E2}", stage: "Warehoused" },
];

// Transfer flow targets
export const TRANSFER_TARGETS = [
  { id: "processor", label: "Processor", emoji: "\u{1F3ED}" },
  { id: "exporter", label: "Exporter", emoji: "\u{1F6A2}" },
  { id: "retailer", label: "Retailer", emoji: "\u{1F6D2}" },
  { id: "manufacturer", label: "Manufacturer", emoji: "\u2699\uFE0F" },
  { id: "roaster", label: "Roaster", emoji: "\u{1F525}" },
  { id: "warehouse", label: "Warehouse", emoji: "\u{1F3E2}" },
  { id: "transporter", label: "Local Transporter", emoji: "\u{1F69A}" },
];

// Delivery status progression
export const DELIVERY_STATUSES = [
  "Dispatched",
  "Picked Up",
  "On the Way",
  "Out for Delivery",
  "Delivered",
];

// Map receiver role to a meaningful receiving stage (instead of generic "Transferred")
export const RECEIVER_ROLE_TO_STAGE = {
  processor: "Received for Processing",
  roaster: "Received for Roasting",
  manufacturer: "Received for Manufacturing",
  exporter: "Received for Export",
  retailer: "Received for Retail",
  warehouse: "Received at Warehouse",
  transporter: "In Transit",
};

// Map action IDs to role display names
export const ACTION_TO_ROLE_MAP = {
  register: "Farmer",
  process: "Processor",
  roast: "Roaster",
  manufacture: "Manufacturer",
  import: "Importer",
  export: "Exporter",
  warehouse: "Warehouse",
  sell: "Retailer",
  transfer: "Transporter",
};

export function getActionLabel(actionId) {
  return ACTION_TO_ROLE_MAP[actionId] || actionId;
}

// Get available self-flow actions for a product
export function getAvailableActions(product) {
  if (!product || product.status === "closed" || product.currentStage === "Sold") return [];
  return SELF_ACTIONS.filter((a) => a.stage !== product.currentStage);
}

// Legacy support
export function getProcessorActions(product) {
  return getAvailableActions(product);
}

// ─── OWNERSHIP & SECURITY ───

export function canUserActOnProduct(userEmail, product) {
  if (!product || !userEmail) return false;
  if (product.pendingAcceptance) return false;
  return product.ownerEmail === userEmail && product.status !== "closed";
}

export function isProductOwner(userEmail, product) {
  return product?.ownerEmail === userEmail;
}

export function isPreviousOwner(userEmail, product) {
  return product?.previousOwner === userEmail;
}

// ─── PRODUCT CRUD ───

export function getAllProducts() {
  return JSON.parse(localStorage.getItem("fairtrace_products") || "[]");
}

export function saveProducts(products) {
  localStorage.setItem("fairtrace_products", JSON.stringify(products));
}

export function getProducts(userEmail) {
  const all = getAllProducts();
  if (!userEmail) return all;
  return all.filter((p) => p.ownerEmail === userEmail || p.previousOwner === userEmail);
}

export function getMyProducts(userEmail) {
  const all = getAllProducts();
  return all.filter((p) => p.ownerEmail === userEmail);
}

export function getPreviousOwnerProducts(userEmail) {
  const all = getAllProducts();
  return all.filter((p) => p.previousOwner === userEmail && p.ownerEmail !== userEmail);
}

export function getProductById(blockchainId) {
  return getAllProducts().find((p) => String(p.blockchainId) === String(blockchainId));
}

export function updateProduct(blockchainId, updates) {
  const products = getAllProducts();
  const idx = products.findIndex((p) => String(p.blockchainId) === String(blockchainId));
  if (idx !== -1) {
    products[idx] = { ...products[idx], ...updates, updatedAt: new Date().toISOString() };
    saveProducts(products);

    // Mirror to backend (upsert)
    const p = products[idx];
    syncProduct({
      blockchainId: Number(p.blockchainId),
      batchId: p.batchId || "",
      productName: p.productName || "",
      productType: p.category || "General",
      farmerName: p.farmerName || "",
      farmLocation: p.farmLocation || "",
      harvestDate: p.harvestDate || p.expiryDate || "",
      certification: p.certification || "None",
      quantity: Number(p.quantity) || 0,
      unit: p.unit || "kg",
      initialPrice: Number(p.initialPrice) || 0,
      currentPrice: Number(p.currentPrice) || 0,
      currentStage: p.currentStage || "Registered",
      currentOwner: _walletForEmail(p.ownerEmail) || (p.currentOwner || ""),
      farmerAddress: _walletForEmail(p.farmerEmail) || (p.farmerAddress || ""),
      description: p.description || "",
      registrationTxHash: p.registrationTxHash || "",
    });
    return products[idx];
  }
  return null;
}

// ─── SELF FLOW ACTION (no ownership change) ───

export function selfActionOnProduct(blockchainId, userEmail, actionData) {
  const product = getProductById(blockchainId);
  if (!product || product.ownerEmail !== userEmail) return null;

  const userRole = getActionLabel(actionData.action);

  updateProduct(blockchainId, {
    currentStage: actionData.stage,
    currentAction: actionData.action,
    currentPrice: actionData.price || product.currentPrice,
  });

  addTransaction({
    productId: blockchainId,
    batchId: product.batchId,
    productName: product.productName,
    category: product.category,
    type: actionData.stage,
    seller: userEmail,
    sellerName: actionData.actor,
    buyer: userEmail,
    buyerName: actionData.actor,
    price: actionData.price || product.currentPrice,
    fromStage: product.currentStage,
    toStage: actionData.stage,
    movementType: actionData.movementType || "",
    regionType: actionData.regionType || "",
    location: actionData.location,
    phone: actionData.phone,
    txHash: actionData.txHash,
    userEmail,
    userRole,
    flowType: "self",
  });

  addTracking({
    productId: blockchainId,
    action: actionData.action,
    stage: actionData.stage,
    userEmail,
    userRole,
    actor: actionData.actor,
    from: { name: actionData.actor, email: userEmail },
    to: { name: actionData.actor, email: userEmail },
    price: actionData.price || product.currentPrice,
    movementType: actionData.movementType || "",
    regionType: actionData.regionType || "",
    location: actionData.location,
    phone: actionData.phone,
    notes: actionData.notes || "",
    txHash: actionData.txHash,
  });

  // Activity log
  addActivityLog({
    userEmail,
    type: ACTIVITY_TYPES.PRODUCT_PROCESSED,
    description: `${actionData.stage} "${product.productName}"`,
    details: { productId: blockchainId, action: actionData.action },
  });

  return getProductById(blockchainId);
}

// ─── TRANSFER FLOW (ownership changes) ───

export function transferProduct(blockchainId, fromEmail, toEmail, actionData) {
  const product = getProductById(blockchainId);
  if (!product || product.ownerEmail !== fromEmail) return null;

  const fromUser = getUserByEmail(fromEmail);
  const toUser = getUserByEmail(toEmail);
  const fromName = fromUser?.fullName || fromEmail;
  const toName = toUser?.fullName || toEmail;
  const userRole = getActionLabel(actionData.action || "transfer");

  // Update product ownership
  const ownerHistory = product.ownerHistory || [];
  ownerHistory.push({
    email: fromEmail,
    name: fromName,
    role: userRole,
    acquiredAt: product.updatedAt || product.createdAt,
    releasedAt: new Date().toISOString(),
  });

  updateProduct(blockchainId, {
    ownerEmail: toEmail,
    previousOwner: fromEmail,
    isLocked: true,
    pendingAcceptance: true,
    ownerHistory,
    currentStage: actionData.stage || RECEIVER_ROLE_TO_STAGE[actionData.receiverRole] || "Transferred",
    currentAction: actionData.action || "transfer",
    currentPrice: actionData.price || product.currentPrice,
  });

  addTransaction({
    productId: blockchainId,
    batchId: product.batchId,
    productName: product.productName,
    category: product.category,
    type: actionData.stage || "Transferred",
    seller: fromEmail,
    sellerName: fromName,
    buyer: toEmail,
    buyerName: toName,
    price: actionData.price || product.currentPrice,
    fromStage: product.currentStage,
    toStage: actionData.stage || "Transferred",
    movementType: actionData.movementType || "",
    regionType: actionData.regionType || "",
    location: actionData.location,
    phone: actionData.phone,
    txHash: actionData.txHash,
    userEmail: fromEmail,
    userRole,
    flowType: "transfer",
  });

  const trackingEntry = {
    productId: blockchainId,
    action: actionData.action || "transfer",
    stage: actionData.stage || "Transferred",
    userEmail: fromEmail,
    userRole,
    actor: fromName,
    from: { name: fromName, email: fromEmail },
    to: { name: toName, email: toEmail },
    price: actionData.price || product.currentPrice,
    movementType: actionData.movementType || "",
    regionType: actionData.regionType || "",
    location: actionData.location,
    phone: actionData.phone,
    notes: actionData.notes || "",
    txHash: actionData.txHash,
  };

  addTracking(trackingEntry);

  // Generate receipt
  const receipt = addReceipt({
    productId: blockchainId,
    productName: product.productName,
    category: product.category,
    from: { name: fromName, email: fromEmail, role: userRole },
    to: { name: toName, email: toEmail, role: actionData.receiverRole || "" },
    action: actionData.stage || "Transferred",
    price: actionData.price || product.currentPrice,
    location: actionData.location,
    phone: actionData.phone,
    txHash: actionData.txHash,
    blockchainId,
  });

  // Notify receiver that they received a product
  persistNotification("product_received", toEmail, {
    productName: product.productName,
    fromName,
  });
  // Notify sender that transfer was completed
  persistNotification("product_transferred", fromEmail, {
    productName: product.productName,
    toName,
  });
  // Activity log
  addActivityLog({
    userEmail: fromEmail,
    type: ACTIVITY_TYPES.PRODUCT_TRANSFERRED,
    description: `Transferred "${product.productName}" to ${toName}`,
    details: { productId: blockchainId, to: toEmail, action: actionData.action },
  });

  return { product: getProductById(blockchainId), receipt };
}

// ─── SELL / CLOSE PRODUCT ───

export function closeProduct(blockchainId, userEmail, sellData) {
  const product = getProductById(blockchainId);
  if (!product || product.ownerEmail !== userEmail) return null;

  const userName = sellData.actor || userEmail;

  updateProduct(blockchainId, {
    currentStage: "Sold",
    currentAction: "sell",
    currentPrice: sellData.price || product.currentPrice,
    status: "closed",
  });

  addTransaction({
    productId: blockchainId,
    batchId: product.batchId,
    productName: product.productName,
    category: product.category,
    type: "Sold",
    seller: userEmail,
    sellerName: userName,
    buyer: sellData.customerName || "Customer",
    buyerName: sellData.customerName || "Customer",
    price: sellData.price,
    fromStage: product.currentStage,
    toStage: "Sold",
    location: sellData.location,
    phone: sellData.phone,
    txHash: sellData.txHash,
    userEmail,
    userRole: "Retailer",
    flowType: "sell",
  });

  addTracking({
    productId: blockchainId,
    action: "sell",
    stage: "Sold",
    userEmail,
    userRole: "Retailer",
    actor: userName,
    from: { name: userName, email: userEmail },
    to: { name: sellData.customerName || "Customer", email: sellData.customerEmail || "" },
    price: sellData.price,
    location: sellData.location,
    phone: sellData.phone,
    notes: sellData.notes || "",
    txHash: sellData.txHash,
  });

  const receipt = addReceipt({
    productId: blockchainId,
    productName: product.productName,
    category: product.category,
    from: { name: userName, email: userEmail, role: "Retailer" },
    to: { name: sellData.customerName || "Customer", email: sellData.customerEmail || "", role: "Customer" },
    action: "Sold",
    price: sellData.price,
    location: sellData.location,
    phone: sellData.phone,
    txHash: sellData.txHash,
    blockchainId,
  });

  // Notify seller
  persistNotification("product_sold", userEmail, {
    productName: product.productName,
    price: sellData.price,
  });
  // Activity log
  addActivityLog({
    userEmail,
    type: ACTIVITY_TYPES.PRODUCT_SOLD,
    description: `Sold "${product.productName}" for ${sellData.price || "N/A"}`,
    details: { productId: blockchainId, customer: sellData.customerName },
  });

  return { product: getProductById(blockchainId), receipt };
}

// ─── INCOMING / ACCEPT / REJECT ───

export function getIncomingProducts(userEmail) {
  if (!userEmail) return [];
  const all = getAllProducts();
  return all.filter((p) => p.ownerEmail === userEmail && p.pendingAcceptance === true);
}

export function acceptProduct(blockchainId, userEmail) {
  const product = getProductById(blockchainId);
  if (!product || product.ownerEmail !== userEmail || !product.pendingAcceptance) return null;

  updateProduct(blockchainId, {
    pendingAcceptance: false,
    isLocked: false,
    acceptedAt: new Date().toISOString(),
  });

  addTracking({
    productId: blockchainId,
    action: "accepted",
    stage: "Accepted",
    userEmail,
    userRole: "Receiver",
    actor: getUserByEmail(userEmail)?.fullName || userEmail,
    from: { name: product.previousOwner, email: product.previousOwner },
    to: { name: getUserByEmail(userEmail)?.fullName || userEmail, email: userEmail },
    notes: "Product accepted by receiver",
  });

  // Notify previous owner
  const receiverName = getUserByEmail(userEmail)?.fullName || userEmail;
  if (product.previousOwner) {
    persistNotification("product_accepted", product.previousOwner, {
      productName: product.productName,
      receiverName,
    });
  }

  addActivityLog({
    userEmail,
    type: ACTIVITY_TYPES.PRODUCT_ACCEPTED,
    description: `Accepted "${product.productName}" from ${product.previousOwner}`,
    details: { productId: blockchainId, from: product.previousOwner },
  });

  return getProductById(blockchainId);
}

export function rejectProduct(blockchainId, userEmail, reason) {
  const product = getProductById(blockchainId);
  if (!product || product.ownerEmail !== userEmail || !product.pendingAcceptance) return null;

  const previousOwner = product.previousOwner;
  if (!previousOwner) return null;

  // Revert ownership to previous owner
  updateProduct(blockchainId, {
    ownerEmail: previousOwner,
    previousOwner: userEmail,
    pendingAcceptance: false,
    isLocked: false,
    currentStage: "Rejected",
    currentAction: "rejected",
  });

  addTracking({
    productId: blockchainId,
    action: "rejected",
    stage: "Rejected",
    userEmail,
    userRole: "Receiver",
    actor: getUserByEmail(userEmail)?.fullName || userEmail,
    from: { name: getUserByEmail(userEmail)?.fullName || userEmail, email: userEmail },
    to: { name: getUserByEmail(previousOwner)?.fullName || previousOwner, email: previousOwner },
    notes: reason || "Product rejected by receiver",
  });

  // Notify previous owner
  const receiverName = getUserByEmail(userEmail)?.fullName || userEmail;
  persistNotification("product_rejected", previousOwner, {
    productName: product.productName,
    receiverName,
    reason: reason || "No reason provided",
  });

  addActivityLog({
    userEmail,
    type: ACTIVITY_TYPES.PRODUCT_REJECTED,
    description: `Rejected "${product.productName}" — returned to ${previousOwner}`,
    details: { productId: blockchainId, to: previousOwner, reason },
  });

  return getProductById(blockchainId);
}

// ─── TRANSACTIONS ───

export function getTransactions(userEmail) {
  const all = JSON.parse(localStorage.getItem("fairtrace_transactions") || "[]");
  if (!userEmail) return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return all.filter((t) => t.userEmail === userEmail || t.seller === userEmail || t.buyer === userEmail)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function getAllTransactions() {
  return JSON.parse(localStorage.getItem("fairtrace_transactions") || "[]")
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function addTransaction(tx) {
  const txs = JSON.parse(localStorage.getItem("fairtrace_transactions") || "[]");
  const stamped = { ...tx, id: Date.now().toString(), timestamp: new Date().toISOString() };
  txs.push(stamped);
  localStorage.setItem("fairtrace_transactions", JSON.stringify(txs));

  // Mirror to backend MongoDB (fail-soft)
  syncTransaction({
    productId: Number(stamped.productId),
    batchId: stamped.batchId || "",
    productName: stamped.productName || "",
    seller: _walletForEmail(stamped.seller) || stamped.seller || "",
    sellerName: stamped.sellerName || stamped.seller || "",
    buyer: _walletForEmail(stamped.buyer) || stamped.buyer || "",
    buyerName: stamped.buyerName || stamped.buyer || "",
    price: Number(stamped.price) || 0,
    fromStage: stamped.fromStage || "",
    toStage: stamped.toStage || stamped.type || "",
    txHash: stamped.txHash || "",
    timestamp: stamped.timestamp,
  });
}

// ─── TRACKING ───

export function getTracking(blockchainId) {
  const all = JSON.parse(localStorage.getItem("fairtrace_tracking") || "[]");
  return all.filter((t) => String(t.productId) === String(blockchainId))
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

export function addTracking(entry) {
  const all = JSON.parse(localStorage.getItem("fairtrace_tracking") || "[]");
  all.push({ ...entry, timestamp: new Date().toISOString() });
  localStorage.setItem("fairtrace_tracking", JSON.stringify(all));
}

// ─── RECEIPTS ───

export function addReceipt(data) {
  const receipts = JSON.parse(localStorage.getItem("fairtrace_receipts") || "[]");
  const receipt = {
    ...data,
    receiptId: `RCP-${new Date().getFullYear()}-${String(receipts.length + 1).padStart(4, "0")}`,
    timestamp: new Date().toISOString(),
  };
  receipts.push(receipt);
  localStorage.setItem("fairtrace_receipts", JSON.stringify(receipts));

  // Mirror to backend
  syncReceipt({
    receiptId: receipt.receiptId,
    productId: Number(receipt.productId || receipt.blockchainId),
    productName: receipt.productName || "",
    from: receipt.from || {},
    to: receipt.to || {},
    action: receipt.action || "transfer",
    price: Number(receipt.price) || 0,
    location: receipt.location || {},
    phone: receipt.phone || {},
    txHash: receipt.txHash || "",
    timestamp: receipt.timestamp,
  });
  return receipt;
}

export function getReceipts(userEmail) {
  const all = JSON.parse(localStorage.getItem("fairtrace_receipts") || "[]");
  if (!userEmail) return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return all.filter((r) => r.from?.email === userEmail || r.to?.email === userEmail)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function getReceiptById(receiptId) {
  const all = JSON.parse(localStorage.getItem("fairtrace_receipts") || "[]");
  return all.find((r) => r.receiptId === receiptId);
}

// ─── DELIVERIES ───

export function addDelivery(delivery) {
  const all = JSON.parse(localStorage.getItem("fairtrace_deliveries") || "[]");
  const newDelivery = {
    ...delivery,
    deliveryId: `DEL-${Date.now()}`,
    status: "Dispatched",
    statusHistory: [{
      status: "Dispatched",
      location: delivery.location,
      phone: delivery.phone,
      timestamp: new Date().toISOString(),
    }],
    createdAt: new Date().toISOString(),
    completedAt: null,
  };
  all.push(newDelivery);
  localStorage.setItem("fairtrace_deliveries", JSON.stringify(all));

  // Mirror to backend
  syncDelivery({
    deliveryId: newDelivery.deliveryId,
    productId: Number(newDelivery.productId),
    productName: newDelivery.productName || "",
    transporterEmail: newDelivery.transporterEmail || "",
    receiverEmail: newDelivery.receiverEmail || "",
    status: newDelivery.status,
    statusHistory: newDelivery.statusHistory,
    dispatchedAt: newDelivery.createdAt,
  });
  return newDelivery;
}

export function getDeliveries(userEmail) {
  const all = JSON.parse(localStorage.getItem("fairtrace_deliveries") || "[]");
  if (!userEmail) return all;
  return all.filter((d) => d.transporterEmail === userEmail || d.receiverEmail === userEmail);
}

export function getDeliveryById(deliveryId) {
  const all = JSON.parse(localStorage.getItem("fairtrace_deliveries") || "[]");
  return all.find((d) => d.deliveryId === deliveryId);
}

export function getDeliveryByProduct(productId) {
  const all = JSON.parse(localStorage.getItem("fairtrace_deliveries") || "[]");
  return all.filter((d) => String(d.productId) === String(productId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
}

export function updateDeliveryStatus(deliveryId, status, location, phone) {
  const all = JSON.parse(localStorage.getItem("fairtrace_deliveries") || "[]");
  const idx = all.findIndex((d) => d.deliveryId === deliveryId);
  if (idx === -1) return null;

  all[idx].status = status;
  all[idx].statusHistory.push({
    status,
    location,
    phone,
    timestamp: new Date().toISOString(),
  });

  if (status === "Delivered") {
    all[idx].completedAt = new Date().toISOString();
  }

  localStorage.setItem("fairtrace_deliveries", JSON.stringify(all));

  // Mirror to backend
  syncDeliveryStatus(deliveryId, status, location, phone);

  // Notify about delivery status
  const del = all[idx];
  const product = getProductById(del.productId);
  const pName = product?.productName || `Product ${del.productId}`;
  if (status === "Delivered") {
    persistNotification("delivery_complete", del.receiverEmail, { productName: pName });
    persistNotification("delivery_complete", del.transporterEmail, { productName: pName });
  } else {
    persistNotification("delivery_update", del.receiverEmail, { productName: pName, status });
  }
  // Activity log
  addActivityLog({
    userEmail: del.transporterEmail,
    type: ACTIVITY_TYPES.DELIVERY_UPDATED,
    description: `Delivery for "${pName}" updated to "${status}"`,
    details: { deliveryId, status },
  });

  // If delivered, transfer ownership
  if (status === "Delivered") {
    const delivery = all[idx];
    const product = getProductById(delivery.productId);
    if (product && product.ownerEmail === delivery.transporterEmail) {
      transferProduct(delivery.productId, delivery.transporterEmail, delivery.receiverEmail, {
        action: "transfer",
        stage: "Delivered",
        price: product.currentPrice,
        location,
        phone,
        txHash: "0x" + Math.random().toString(16).slice(2, 42),
        receiverRole: "",
      });
    }

    addTracking({
      productId: delivery.productId,
      action: "delivered",
      stage: "Delivered",
      userEmail: delivery.transporterEmail,
      userRole: "Local Transporter",
      actor: delivery.transporterName || delivery.transporterEmail,
      from: { name: delivery.transporterName || delivery.transporterEmail, email: delivery.transporterEmail },
      to: { name: delivery.receiverName || delivery.receiverEmail, email: delivery.receiverEmail },
      location,
      phone,
      txHash: "0x" + Math.random().toString(16).slice(2, 42),
    });
  } else {
    // Track intermediate delivery statuses
    const delivery = all[idx];
    addTracking({
      productId: delivery.productId,
      action: status.toLowerCase().replace(/\s+/g, "_"),
      stage: status,
      userEmail: delivery.transporterEmail,
      userRole: "Local Transporter",
      actor: delivery.transporterName || delivery.transporterEmail,
      from: { name: delivery.transporterName || delivery.transporterEmail, email: delivery.transporterEmail },
      to: { name: delivery.receiverName || delivery.receiverEmail, email: delivery.receiverEmail },
      location,
      phone,
    });
  }

  return all[idx];
}

// ─── USERS ───

export function getUsers() {
  return JSON.parse(localStorage.getItem("fairtrace_users") || "[]");
}

export function getUserByEmail(email) {
  if (!email) return null;
  const users = getUsers();
  return users.find((u) => u.email === email);
}

// ─── ORDERS (legacy) ───

export function getOrders(userEmail) {
  const all = JSON.parse(localStorage.getItem("fairtrace_orders") || "[]");
  if (!userEmail) return all.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return all.filter((o) => o.buyerEmail === userEmail || o.sellerEmail === userEmail)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

export function saveOrders(orders) {
  localStorage.setItem("fairtrace_orders", JSON.stringify(orders));
}

export function addOrder(order) {
  const orders = getOrders();
  orders.push({ ...order, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  saveOrders(orders);
}

// ─── DATA MIGRATION ───
// Run on app load to backfill missing fields on old products

export function migrateData() {
  const products = getAllProducts();
  let changed = false;
  products.forEach((p) => {
    if (!p.previousOwner) { p.previousOwner = ""; changed = true; }
    if (p.isLocked === undefined) { p.isLocked = false; changed = true; }
    if (!p.ownerHistory) { p.ownerHistory = []; changed = true; }
    if (!p.currentAction) { p.currentAction = ""; changed = true; }
    if (!p.status) { p.status = p.currentStage === "Sold" ? "closed" : "open"; changed = true; }
    if (p.pendingAcceptance === undefined) { p.pendingAcceptance = false; changed = true; }
    // Backfill location object from farmLocation string
    if (p.farmLocation && !p.location) {
      p.location = { address: { line1: p.farmLocation } };
      changed = true;
    }
  });
  if (changed) saveProducts(products);

  // Backfill "Transferred" tracking entries with role-based stages
  const tracking = JSON.parse(localStorage.getItem("fairtrace_tracking") || "[]");
  let trackingChanged = false;
  tracking.forEach((t) => {
    if (t.stage === "Transferred" && t.action === "transfer" && t.to?.email) {
      // Try to determine receiver role from the user record
      const receiver = getUserByEmail(t.to.email);
      if (receiver) {
        const role = receiver.preferredRole || receiver.role;
        const newStage = RECEIVER_ROLE_TO_STAGE[role];
        if (newStage) {
          t.stage = newStage;
          trackingChanged = true;
        }
      }
    }
  });
  if (trackingChanged) localStorage.setItem("fairtrace_tracking", JSON.stringify(tracking));
}

// ─── STAGE DISPLAY ───

export const STAGE_COLORS = {
  Registered: "bg-[#d1eaea] text-[#1d5c5c]",
  Processed: "bg-amber-100 text-amber-700",
  Roasted: "bg-orange-100 text-orange-700",
  Manufactured: "bg-slate-100 text-slate-700",
  Imported: "bg-sky-100 text-sky-700",
  Warehoused: "bg-cyan-100 text-cyan-700",
  Exported: "bg-[#d1eaea] text-[#1d5c5c]",
  Transferred: "bg-violet-100 text-violet-700",
  Retailed: "bg-green-100 text-green-700",
  Sold: "bg-emerald-100 text-emerald-700",
  Dispatched: "bg-[#d1eaea] text-[#1d5c5c]",
  "Picked Up": "bg-purple-100 text-purple-700",
  "On the Way": "bg-yellow-100 text-yellow-700",
  "Out for Delivery": "bg-orange-100 text-orange-700",
  Delivered: "bg-green-100 text-green-700",
  // Received stages (from RECEIVER_ROLE_TO_STAGE)
  "Received for Processing": "bg-amber-50 text-amber-600",
  "Received for Roasting": "bg-orange-50 text-orange-600",
  "Received for Manufacturing": "bg-slate-50 text-slate-600",
  "Received for Export": "bg-[#e6f3f3] text-[#2a7c7c]",
  "Received for Retail": "bg-green-50 text-green-600",
  "Received at Warehouse": "bg-cyan-50 text-cyan-600",
  "In Transit": "bg-indigo-100 text-indigo-700",
  Accepted: "bg-emerald-50 text-emerald-600",
  Rejected: "bg-red-100 text-red-700",
};

export const STAGE_EMOJIS = {
  Registered: "\u{1F468}\u200D\u{1F33E}",
  Processed: "\u{1F3ED}",
  Roasted: "\u{1F525}",
  Manufactured: "\u2699\uFE0F",
  Imported: "\u{1F4E5}",
  Warehoused: "\u{1F3E2}",
  Exported: "\u{1F6A2}",
  Transferred: "\u{1F69A}",
  Retailed: "\u{1F3EC}",
  Sold: "\u2705",
  Dispatched: "\u{1F4E6}",
  "Picked Up": "\u{1F3C3}",
  "On the Way": "\u{1F69A}",
  "Out for Delivery": "\u{1F6F5}",
  Delivered: "\u{1F4E8}",
  // Received stages
  "Received for Processing": "\u{1F4E5}",
  "Received for Roasting": "\u{1F4E5}",
  "Received for Manufacturing": "\u{1F4E5}",
  "Received for Export": "\u{1F4E5}",
  "Received for Retail": "\u{1F4E5}",
  "Received at Warehouse": "\u{1F4E5}",
  "In Transit": "\u{1F69A}",
  Accepted: "\u2705",
  Rejected: "\u274C",
};

// Map marker colors for tracking page
export const TRACKING_MARKER_COLORS = {
  Registered: "#22C55E",   // green
  Processed: "#3B82F6",    // blue
  Roasted: "#3B82F6",      // blue
  Manufactured: "#3B82F6", // blue
  Exported: "#F97316",     // orange
  Imported: "#F97316",     // orange
  Warehoused: "#3B82F6",   // blue
  Transferred: "#8B5CF6",  // purple
  Dispatched: "#8B5CF6",   // purple
  "Picked Up": "#8B5CF6",  // purple
  "On the Way": "#8B5CF6", // purple
  "Out for Delivery": "#8B5CF6", // purple
  Delivered: "#8B5CF6",    // purple
  Retailed: "#EF4444",     // red
  Sold: "#EF4444",         // red
};
