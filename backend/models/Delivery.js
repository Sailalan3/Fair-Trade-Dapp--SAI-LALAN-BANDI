const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema(
  {
    deliveryId: {
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
    transporterEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    receiverEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["Dispatched", "Picked Up", "On the Way", "Out for Delivery", "Delivered"],
      default: "Dispatched",
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
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
      },
    ],
    dispatchedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

deliverySchema.index({ productId: 1 });
deliverySchema.index({ transporterEmail: 1 });
deliverySchema.index({ receiverEmail: 1 });
deliverySchema.index({ status: 1 });

module.exports = mongoose.model("Delivery", deliverySchema);
