const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    walletAddress: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
    },
    name: {
      type: String,
      default: "",
    },
    email: {
      type: String,
      default: "",
      lowercase: true,
    },
    password: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["farmer", "processor", "exporter", "retailer", "roaster", "manufacturer", "transporter", "warehouse", "admin"],
      required: true,
    },
    preferredRole: {
      type: String,
      enum: ["farmer", "processor", "exporter", "retailer", "roaster", "manufacturer", "transporter", "warehouse", "admin"],
      default: "",
    },
    organization: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    phone: {
      countryCode: { type: String, default: "" },
      number: { type: String, default: "" },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);
