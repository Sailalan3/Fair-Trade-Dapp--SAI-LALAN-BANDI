const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    receiptId: {
      type: String,
      required: true,
      unique: true,
    },
    productId: {
      type: Number,
      required: true,
    },
    productName: {
      type: String,
      default: "",
    },
    from: {
      email: { type: String, default: "" },
      name: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    to: {
      email: { type: String, default: "" },
      name: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    action: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      default: 0,
    },
    location: {
      address: {
        line1: { type: String, default: "" },
        line2: { type: String, default: "" },
        country: { type: String, default: "" },
        state: { type: String, default: "" },
        city: { type: String, default: "" },
        postalCode: { type: String, default: "" },
      },
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    phone: {
      countryCode: { type: String, default: "" },
      number: { type: String, default: "" },
    },
    txHash: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

receiptSchema.index({ productId: 1 });
receiptSchema.index({ "from.email": 1 });
receiptSchema.index({ "to.email": 1 });

module.exports = mongoose.model("Receipt", receiptSchema);
