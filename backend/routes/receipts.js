const express = require("express");
const Receipt = require("../models/Receipt");

const router = express.Router();

// POST /api/receipts — upsert by receiptId
router.post("/", async (req, res) => {
  try {
    const r = req.body;
    if (!r.receiptId) return res.status(400).json({ error: "receiptId required" });
    const saved = await Receipt.findOneAndUpdate(
      { receiptId: r.receiptId },
      r,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ receipt: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/receipts — list all (or filter by productId)
router.get("/", async (req, res) => {
  try {
    const q = {};
    if (req.query.productId) q.productId = Number(req.query.productId);
    if (req.query.fromEmail) q["from.email"] = req.query.fromEmail;
    if (req.query.toEmail) q["to.email"] = req.query.toEmail;
    const receipts = await Receipt.find(q).sort({ timestamp: -1 }).limit(500);
    res.json({ receipts, total: receipts.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/receipts/:receiptId
router.get("/:receiptId", async (req, res) => {
  try {
    const r = await Receipt.findOne({ receiptId: req.params.receiptId });
    if (!r) return res.status(404).json({ error: "Not found" });
    res.json({ receipt: r });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
