import express from "express";
import {
  adminOverview,
  adminTransactionReport,
  adminListOrders,
  adminCreateProduct,
  adminDeleteProduct,
  adminDeleteUser,
  adminUpdateOrderStatus,
  adminUpdateProduct,
  adminUsers,
  aiRecommendations,
  createOrder,
  getCart,
  getWishlist,
  requestOrderCancel,
  requestOrderExchange,
  requestOrderReturn,
  removeCartItem,
  toggleWishlist,
  upsertCartItem,
} from "../controllers/shopController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validateMiddleware.js";
import {
  adminOrderStatusValidation,
  cartItemValidation,
  orderActionValidation,
  orderValidation,
  productIdParamValidation,
  wishlistValidation,
} from "../validators/shopValidators.js";

const router = express.Router();

router.use(protect);
router.get("/cart", getCart);
router.put("/cart", cartItemValidation, validate, upsertCartItem);
router.delete("/cart/:productId", productIdParamValidation, validate, removeCartItem);
router.get("/wishlist", getWishlist);
router.put("/wishlist", wishlistValidation, validate, toggleWishlist);
router.post("/orders", orderValidation, validate, createOrder);
router.patch("/orders/:id/cancel", orderActionValidation, validate, requestOrderCancel);
router.patch("/orders/:id/return", orderActionValidation, validate, requestOrderReturn);
router.patch("/orders/:id/exchange", orderActionValidation, validate, requestOrderExchange);
router.get("/recommendations", aiRecommendations);
router.get("/admin/overview", adminOnly, adminOverview);
router.get("/admin/reports/transactions", adminOnly, adminTransactionReport);
router.get("/admin/orders", adminOnly, adminListOrders);
router.get("/admin/users", adminOnly, adminUsers);
router.delete("/admin/users/:id", adminOnly, adminDeleteUser);
router.post("/admin/products", adminOnly, adminCreateProduct);
router.put("/admin/products/:id", adminOnly, adminUpdateProduct);
router.delete("/admin/products/:id", adminOnly, adminDeleteProduct);
router.patch("/admin/orders/:id", adminOnly, adminOrderStatusValidation, validate, adminUpdateOrderStatus);

export default router;
