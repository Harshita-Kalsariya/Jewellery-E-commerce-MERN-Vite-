import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      enum: ["rings", "necklaces", "bracelets", "earrings", "pendants"],
      required: true,
    },
    material: { type: String, enum: ["gold", "silver", "diamond"], required: true },
    purity: { type: String, enum: ["18k", "22k"], required: true },
    weight: { type: Number, required: true },
    images: [{ type: String }],
    description: { type: String, required: true },
    stock: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    reviews: [reviewSchema],
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
