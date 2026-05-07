// ─── Product Batch System ───

import { getAllProducts } from "./store";

const BATCH_KEY = "fairtrace_batches";

export function generateBatchId(prefix = "BATCH") {
  const counter = parseInt(localStorage.getItem("fairtrace_batch_counter") || "0") + 1;
  localStorage.setItem("fairtrace_batch_counter", JSON.stringify(counter));
  return `${prefix}-${String(counter).padStart(4, "0")}`;
}

export function createBatch({ batchId, name, category, ownerEmail, productIds, notes }) {
  const all = JSON.parse(localStorage.getItem(BATCH_KEY) || "[]");
  const batch = {
    id: batchId || generateBatchId(),
    name: name || "",
    category: category || "",
    ownerEmail,
    productIds: productIds || [],
    notes: notes || "",
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.push(batch);
  localStorage.setItem(BATCH_KEY, JSON.stringify(all));
  return batch;
}

export function getBatches(ownerEmail = null) {
  const all = JSON.parse(localStorage.getItem(BATCH_KEY) || "[]");
  if (!ownerEmail) return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return all.filter(b => b.ownerEmail === ownerEmail).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getBatchById(batchId) {
  const all = JSON.parse(localStorage.getItem(BATCH_KEY) || "[]");
  return all.find(b => b.id === batchId);
}

export function addProductToBatch(batchId, productId) {
  const all = JSON.parse(localStorage.getItem(BATCH_KEY) || "[]");
  const idx = all.findIndex(b => b.id === batchId);
  if (idx === -1) return null;
  if (!all[idx].productIds.includes(productId)) {
    all[idx].productIds.push(productId);
    all[idx].updatedAt = new Date().toISOString();
    localStorage.setItem(BATCH_KEY, JSON.stringify(all));
  }
  return all[idx];
}

export function getBatchProducts(batchId) {
  const batch = getBatchById(batchId);
  if (!batch) return [];
  const products = getAllProducts();
  return products.filter(p => batch.productIds.includes(String(p.blockchainId)));
}

export function getBatchStats(ownerEmail) {
  const batches = getBatches(ownerEmail);
  return {
    total: batches.length,
    active: batches.filter(b => b.status === "active").length,
    totalProducts: batches.reduce((sum, b) => sum + (b.productIds?.length || 0), 0),
  };
}
