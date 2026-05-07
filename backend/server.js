require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { initBlockchain } = require("./config/blockchain");

// Route imports
const authRoutes = require("./routes/auth");
const productRoutes = require("./routes/products");
const transactionRoutes = require("./routes/transactions");
const adminRoutes = require("./routes/admin");
const receiptRoutes = require("./routes/receipts");
const deliveryRoutes = require("./routes/deliveries");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5175" }));
app.use(express.json({ limit: "10mb" }));

// Connect to database
connectDB();

// Initialize blockchain connection
initBlockchain();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/deliveries", deliveryRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app;
