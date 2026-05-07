import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const login = (data) => api.post("/auth/login", data);
export const getMe = () => api.get("/auth/me");
export const updateProfile = (data) => api.put("/auth/profile", data);

// Products
export const getProducts = (params) => api.get("/products", { params });
export const getMyProducts = () => api.get("/products/my");
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post("/products", data);
export const getProductHistory = (id) => api.get(`/products/${id}/history`);
export const getProductQR = (id) => api.get(`/products/${id}/qr`);
export const transferProduct = (id, data) => api.put(`/products/${id}/transfer`, data);

// Transactions
export const getTransactions = (params) => api.get("/transactions", { params });
export const getMyTransactions = () => api.get("/transactions/my");
export const getTransaction = (txHash) => api.get(`/transactions/${txHash}`);

// Admin
export const getAdminStats = () => api.get("/admin/stats");
export const getAdminUsers = () => api.get("/admin/users");
export const updateUserRole = (address, role) =>
  api.put(`/admin/users/${address}/role`, { role });

export default api;
