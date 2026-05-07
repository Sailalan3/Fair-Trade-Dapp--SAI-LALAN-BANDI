const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    productId: {
      type: Number,
      required: true,
    },
    batchId: {
      type: String,
      default: "",
    },
    productName: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      default: "",
    },
    seller: {
      type: String,
      required: true,
      lowercase: true,
    },
    sellerName: {
      type: String,
      default: "",
    },
    buyer: {
      type: String,
      required: true,
      lowercase: true,
    },
    buyerName: {
      type: String,
      default: "",
    },
    userEmail: {
      type: String,
      default: "",
      lowercase: true,
    },
    price: {
      type: Number,
      required: true,
    },
    fromStage: {
      type: String,
      required: true,
    },
    toStage: {
      type: String,
      required: true,
    },
    movementType: {
      type: String,
      enum: ["import", "export", ""],
      default: "",
    },
    regionType: {
      type: String,
      enum: ["domestic", "international", ""],
      default: "",
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
    receiptId: {
      type: String,
      default: "",
    },
    txHash: {
      type: String,
      required: true,
    },
    blockNumber: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

transactionSchema.index({ productId: 1 });
transactionSchema.index({ seller: 1 });
transactionSchema.index({ buyer: 1 });
transactionSchema.index({ txHash: 1 });
transactionSchema.index({ userEmail: 1 });

module.exports = mongoose.model("Transaction", transactionSchema);
