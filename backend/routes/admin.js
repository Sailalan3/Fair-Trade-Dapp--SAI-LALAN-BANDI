const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();

// GET /api/admin/stats - Dashboard statistics
router.get("/stats", auth, requireRole("admin"), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    const totalTransactions = await Transaction.countDocuments();

    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    const productsByStage = await Product.aggregate([
      { $group: { _id: "$currentStage", count: { $sum: 1 } } },
    ]);

    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(10);

    const recentProducts = await Product.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      totalUsers,
      totalProducts,
      totalTransactions,
      usersByRole,
      productsByStage,
      recentTransactions,
      recentProducts,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/users - List all users
router.get("/users", auth, requireRole("admin"), async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/users/:walletAddress/role - Update user role
router.put("/users/:walletAddress/role", auth, requireRole("admin"), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findOneAndUpdate(
      { walletAddress: req.params.walletAddress.toLowerCase() },
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/users/:walletAddress - Deactivate user
router.delete("/users/:walletAddress", auth, requireRole("admin"), async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { walletAddress: req.params.walletAddress.toLowerCase() },
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deactivated", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
