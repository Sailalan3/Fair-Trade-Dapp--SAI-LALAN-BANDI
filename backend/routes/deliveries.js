const express = require("express");
const Delivery = require("../models/Delivery");

const router = express.Router();

// POST /api/deliveries — upsert by deliveryId
router.post("/", async (req, res) => {
  try {
    const d = req.body;
    if (!d.deliveryId) return res.status(400).json({ error: "deliveryId required" });
    if (!d.transporterEmail || !d.receiverEmail)
      return res.status(400).json({ error: "transporterEmail and receiverEmail required" });
    const saved = await Delivery.findOneAndUpdate(
      { deliveryId: d.deliveryId },
      d,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ delivery: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/deliveries/:deliveryId/status — push new status
router.put("/:deliveryId/status", async (req, res) => {
  try {
    const { status, location, phone } = req.body;
    if (!status) return res.status(400).json({ error: "status required" });
    const d = await Delivery.findOne({ deliveryId: req.params.deliveryId });
    if (!d) return res.status(404).json({ error: "Not found" });
    d.status = status;
    d.statusHistory.push({
      status,
      location: location || {},
      phone: phone || {},
      timestamp: new Date(),
    });
    if (status === "Delivered") d.completedAt = new Date();
    await d.save();
    res.json({ delivery: d });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/deliveries — list
router.get("/", async (req, res) => {
  try {
    const q = {};
    if (req.query.productId) q.productId = Number(req.query.productId);
    if (req.query.transporterEmail) q.transporterEmail = req.query.transporterEmail;
    if (req.query.receiverEmail) q.receiverEmail = req.query.receiverEmail;
    if (req.query.status) q.status = req.query.status;
    const deliveries = await Delivery.find(q).sort({ dispatchedAt: -1 }).limit(500);
    res.json({ deliveries, total: deliveries.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/deliveries/:deliveryId
router.get("/:deliveryId", async (req, res) => {
  try {
    const d = await Delivery.findOne({ deliveryId: req.params.deliveryId });
    if (!d) return res.status(404).json({ error: "Not found" });
    res.json({ delivery: d });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
