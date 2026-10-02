import express from "express";
import { createReview, getProductBySlug, getProducts } from "../controllers/productController.js";
import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validateMiddleware.js";
import { reviewValidation } from "../validators/shopValidators.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/:slug", getProductBySlug);
router.post("/:id/reviews", protect, reviewValidation, validate, createReview);

export default router;
