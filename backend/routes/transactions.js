const express = require("express");
const Transaction = require("../models/Transaction");
const { auth } = require("../middleware/auth");

const router = express.Router();

// GET /api/transactions - List all transactions
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, productId } = req.query;
    const query = {};

    if (productId) query.productId = parseInt(productId);

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions/my - User's transactions
router.get("/my", auth, async (req, res) => {
  try {
    const transactions = await Transaction.find({
      $or: [{ seller: req.walletAddress }, { buyer: req.walletAddress }],
    }).sort({ createdAt: -1 });

    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/transactions/:txHash - Get by transaction hash
router.get("/:txHash", async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ txHash: req.params.txHash });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }
    res.json({ transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/transactions/sync — upsert (DEMO_MODE, no auth)
router.post("/sync", async (req, res) => {
  try {
    const t = req.body;
    if (typeof t.productId !== "number" && !t.productId)
      return res.status(400).json({ error: "productId required" });
    t.productId = Number(t.productId);
    if (typeof t.seller === "string") t.seller = t.seller.toLowerCase();
    if (typeof t.buyer === "string") t.buyer = t.buyer.toLowerCase();
    const filter = t.txHash
      ? { txHash: t.txHash, productId: t.productId }
      : {
          productId: t.productId,
          fromStage: t.fromStage,
          toStage: t.toStage,
          timestamp: t.timestamp,
        };
    const saved = await Transaction.findOneAndUpdate(filter, t, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    res.status(201).json({ transaction: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
