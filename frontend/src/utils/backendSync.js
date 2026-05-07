// Backend sync layer — fail-soft mirror to MongoDB.
// localStorage stays primary truth; this just mirrors to /api so Compass populates.
// Every call wraps in try/catch — if backend down or returns error, app keeps working.

import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const client = axios.create({
  baseURL: API_BASE,
  timeout: 5000,
  headers: { "Content-Type": "application/json" },
});

// Silent fail wrapper
async function tryPost(path, payload) {
  try {
    const r = await client.post(path, payload);
    return r.data;
  } catch (err) {
    // Don't throw — UI must keep working even if backend down
    console.warn(`[backendSync] POST ${path} failed:`, err.message);
    return null;
  }
}

async function tryPut(path, payload) {
  try {
    const r = await client.put(path, payload);
    return r.data;
  } catch (err) {
    console.warn(`[backendSync] PUT ${path} failed:`, err.message);
    return null;
  }
}

// ─── Users / Auth ───
export const syncUserLogin = (walletAddress, name, role) =>
  tryPost("/auth/login", { walletAddress, name, role });

// ─── Products ───
export const syncProduct = (product) => tryPost("/products/sync", product);

// ─── Transactions ───
export const syncTransaction = (transaction) =>
  tryPost("/transactions/sync", transaction);

// ─── Receipts ───
export const syncReceipt = (receipt) => tryPost("/receipts", receipt);

// ─── Deliveries ───
export const syncDelivery = (delivery) => tryPost("/deliveries", delivery);
export const syncDeliveryStatus = (deliveryId, status, location, phone) =>
  tryPut(`/deliveries/${deliveryId}/status`, { status, location, phone });

export default {
  syncUserLogin,
  syncProduct,
  syncTransaction,
  syncReceipt,
  syncDelivery,
  syncDeliveryStatus,
};
