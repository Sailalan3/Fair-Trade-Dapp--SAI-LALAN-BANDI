const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    blockchainId: {
      type: Number,
      required: true,
      unique: true,
    },
    batchId: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productType: {
      type: String,
      default: "General",
    },
    category: {
      type: String,
      enum: ["agriculture", "food", "textile", "manufacturing", "other"],
      default: "agriculture",
    },
    farmerName: {
      type: String,
      required: true,
    },
    farmLocation: {
      type: String,
      required: true,
    },
    harvestDate: {
      type: Date,
      required: true,
    },
    certification: {
      type: String,
      default: "None",
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: "kg",
    },
    initialPrice: {
      type: Number,
      required: true,
    },
    currentPrice: {
      type: Number,
      default: 0,
    },
    currentStage: {
      type: String,
      enum: [
        "Registered", "Processed", "Roasted", "Manufactured",
        "Warehoused", "Stored", "Reprocessed",
        "Exported", "Retailed", "Sold",
        "Dispatched", "Picked Up", "On the Way", "Out for Delivery", "Delivered",
      ],
      default: "Registered",
    },
    currentAction: {
      type: String,
      default: "",
    },
    currentOwner: {
      type: String,
      required: true,
      lowercase: true,
    },
    ownerEmail: {
      type: String,
      default: "",
      lowercase: true,
    },
    previousOwner: {
      type: String,
      default: "",
      lowercase: true,
    },
    ownerHistory: {
      type: [String],
      default: [],
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
    },
    farmerAddress: {
      type: String,
      required: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    qrCode: {
      type: String,
      default: "",
    },
    registrationTxHash: {
      type: String,
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
    soldTo: {
      type: String,
      default: "",
    },
    receiptId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

productSchema.index({ batchId: 1 });
productSchema.index({ currentOwner: 1 });
productSchema.index({ ownerEmail: 1 });
productSchema.index({ status: 1 });
productSchema.index({ productName: "text", batchId: "text" });

module.exports = mongoose.model("Product", productSchema);
