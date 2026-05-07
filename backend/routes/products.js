const express = require("express");
const QRCode = require("qrcode");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const { auth, requireRole } = require("../middleware/auth");

const router = express.Router();

const STAGE_NAMES = ["Registered", "Processed", "Exported", "Retailed", "Sold"];

// POST /api/products - Register a new product
router.post("/", auth, requireRole("farmer"), async (req, res) => {
  try {
    const {
      blockchainId,
      batchId,
      productName,
      productType,
      farmerName,
      farmLocation,
      harvestDate,
      certification,
      quantity,
      unit,
      initialPrice,
      description,
      registrationTxHash,
    } = req.body;

    // Generate QR Code
    const trackingUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/track/${blockchainId}`;
    const qrCode = await QRCode.toDataURL(trackingUrl);

    const product = new Product({
      blockchainId,
      batchId,
      productName,
      productType: productType || "General",
      farmerName,
      farmLocation,
      harvestDate,
      certification: certification || "None",
      quantity,
      unit: unit || "kg",
      initialPrice,
      currentPrice: initialPrice,
      currentOwner: req.walletAddress,
      farmerAddress: req.walletAddress,
      description: description || "",
      qrCode,
      registrationTxHash: registrationTxHash || "",
    });

    await product.save();

    res.status(201).json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products - List all products (with filters)
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, stage, search, owner } = req.query;
    const query = {};

    if (stage) query.currentStage = stage;
    if (owner) query.currentOwner = owner.toLowerCase();
    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/my - Get logged-in user's products
router.get("/my", auth, async (req, res) => {
  try {
    const products = await Product.find({
      currentOwner: req.walletAddress,
    }).sort({ createdAt: -1 });

    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id - Get product details
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findOne({ blockchainId: parseInt(req.params.id) });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json({ product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id/history - Full supply chain history
router.get("/:id/history", async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await Product.findOne({ blockchainId: productId });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const transactions = await Transaction.find({ productId }).sort({ timestamp: 1 });

    res.json({
      product,
      transactions,
      journey: transactions.map((tx) => ({
        from: tx.sellerName || tx.seller,
        to: tx.buyerName || tx.buyer,
        price: tx.price,
        stage: tx.toStage,
        timestamp: tx.timestamp,
        txHash: tx.txHash,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id/qr - Get QR code
router.get("/:id/qr", async (req, res) => {
  try {
    const product = await Product.findOne({ blockchainId: parseInt(req.params.id) });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    if (!product.qrCode) {
      const trackingUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/track/${req.params.id}`;
      product.qrCode = await QRCode.toDataURL(trackingUrl);
      await product.save();
    }

    res.json({ qrCode: product.qrCode, productId: product.blockchainId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id/transfer - Record ownership transfer
router.put("/:id/transfer", auth, async (req, res) => {
  try {
    const { buyer, buyerName, price, txHash, blockNumber, toStage } = req.body;
    const productId = parseInt(req.params.id);

    const product = await Product.findOne({ blockchainId: productId });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Create transaction record
    const transaction = new Transaction({
      productId,
      batchId: product.batchId,
      productName: product.productName,
      seller: req.walletAddress,
      sellerName: req.user.name,
      buyer: buyer.toLowerCase(),
      buyerName: buyerName || "",
      price,
      fromStage: product.currentStage,
      toStage: toStage || STAGE_NAMES[STAGE_NAMES.indexOf(product.currentStage) + 1],
      txHash,
      blockNumber: blockNumber || 0,
    });
    await transaction.save();

    // Update product
    product.currentOwner = buyer.toLowerCase();
    product.currentStage = transaction.toStage;
    product.currentPrice = price;
    await product.save();

    res.json({ product, transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Sync endpoints (no JWT, used by frontend mirror layer) ───
// POST /api/products/sync — upsert by blockchainId
router.post("/sync", async (req, res) => {
  try {
    const p = req.body;
    if (typeof p.blockchainId !== "number" && !p.blockchainId)
      return res.status(400).json({ error: "blockchainId required" });
    const blockchainId = Number(p.blockchainId);
    const trackingUrl = `${process.env.FRONTEND_URL || "http://localhost:5175"}/track/${blockchainId}`;
    if (!p.qrCode) p.qrCode = await QRCode.toDataURL(trackingUrl);
    p.blockchainId = blockchainId;
    if (typeof p.farmerAddress === "string") p.farmerAddress = p.farmerAddress.toLowerCase();
    if (typeof p.currentOwner === "string") p.currentOwner = p.currentOwner.toLowerCase();
    const saved = await Product.findOneAndUpdate(
      { blockchainId },
      p,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ product: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
