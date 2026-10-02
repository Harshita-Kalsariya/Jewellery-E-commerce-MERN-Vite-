import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        name: String,
        image: String,
        qty: Number,
        price: Number,
      },
    ],
    shippingAddress: {
      fullName: String,
      address: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
    },
    paymentMethod: { type: String, default: "Razorpay" },
    /** Extra fields chosen at checkout (UPI id, bank, notes, etc.) */
    paymentDetails: {
      payerName: String,
      payerPhone: String,
      upiId: String,
      bankName: String,
      cardLast4: String,
      notes: String,
    },
    paymentResult: {
      razorpayOrderId: String,
      razorpayPaymentId: String,
      paidAt: Date,
      status: String,
    },
    itemsPrice: Number,
    taxPrice: Number,
    shippingPrice: Number,
    totalPrice: Number,
    orderStatus: {
      type: String,
      enum: ["pending", "shipped", "delivered", "cancelled", "return_requested", "returned", "exchange_requested", "exchanged"],
      default: "pending",
    },
    cancelledAt: Date,
    cancellationReason: String,
    returnRequestedAt: Date,
    returnReason: String,
    exchangeRequestedAt: Date,
    exchangeReason: String,
    deliveredAt: Date,
    exchangedAt: Date,
    exchangeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
