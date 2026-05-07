const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

const router = express.Router();

// POST /api/auth/login - Wallet-based login / register
router.post("/login", async (req, res) => {
  try {
    const { walletAddress, name, role } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    let user = await User.findOne({ walletAddress: walletAddress.toLowerCase() });

    if (!user) {
      // Auto-register new user
      user = new User({
        walletAddress: walletAddress.toLowerCase(),
        name: name || "",
        role: role || "farmer",
      });
      await user.save();
    }

    const token = jwt.sign(
      { walletAddress: user.walletAddress, role: user.role },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        walletAddress: user.walletAddress,
        name: user.name,
        role: user.role,
        organization: user.organization,
        location: user.location,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/auth/me - Get current user
router.get("/me", auth, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile - Update profile
router.put("/profile", auth, async (req, res) => {
  try {
    const { name, email, organization, location } = req.body;
    const user = await User.findOneAndUpdate(
      { walletAddress: req.walletAddress },
      { name, email, organization, location },
      { new: true }
    );
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/sync-user — upsert user by walletAddress OR email
// Used by seed script + frontend mirror for users registered without a wallet
router.post("/sync-user", async (req, res) => {
  try {
    const { walletAddress, email, name, role, preferredRole, organization, phone } = req.body;
    if (!walletAddress && !email)
      return res.status(400).json({ error: "walletAddress or email required" });

    const filter = walletAddress
      ? { walletAddress: walletAddress.toLowerCase() }
      : { email: email.toLowerCase() };

    const update = {
      name: name || "",
      email: (email || "").toLowerCase(),
      role: role || "farmer",
      preferredRole: preferredRole || role || "",
      organization: organization || "",
      phone: phone || {},
    };
    if (walletAddress) update.walletAddress = walletAddress.toLowerCase();

    const user = await User.findOneAndUpdate(filter, update, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
    res.status(201).json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
