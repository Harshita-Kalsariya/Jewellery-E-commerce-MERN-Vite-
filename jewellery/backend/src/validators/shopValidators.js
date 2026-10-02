import { body, param } from "express-validator";

export const cartItemValidation = [
  body("productId").isMongoId().withMessage("Valid product id is required"),
  body("qty").optional().isInt({ min: 1, max: 20 }).withMessage("Quantity must be between 1 and 20"),
  body("mode").optional().isIn(["set", "increment"]).withMessage("Invalid cart update mode"),
];

export const wishlistValidation = [body("productId").isMongoId().withMessage("Valid product id is required")];

export const productIdParamValidation = [param("productId").isMongoId().withMessage("Valid product id is required")];

export const reviewValidation = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("comment").trim().notEmpty().withMessage("Comment is required"),
];

export const orderValidation = [
  body("items").isArray({ min: 1 }).withMessage("Order must have at least one item"),
  body("shippingAddress.fullName").trim().notEmpty().withMessage("Shipping full name is required"),
  body("shippingAddress.address").trim().notEmpty().withMessage("Address is required"),
  body("shippingAddress.city").trim().notEmpty().withMessage("City is required"),
  body("shippingAddress.postalCode").trim().notEmpty().withMessage("Postal code is required"),
  body("totalPrice").isFloat({ min: 1 }).withMessage("Total price must be greater than 0"),
  body("paymentMethod").optional().isString(),
  body("paymentDetails").optional().isObject(),
];

export const adminOrderStatusValidation = [
  body("orderStatus")
    .isIn(["pending", "shipped", "delivered", "cancelled", "return_requested", "returned", "exchange_requested", "exchanged"])
    .withMessage("Invalid order status"),
];

export const orderActionValidation = [
  param("id").isMongoId().withMessage("Valid order id is required"),
  body("reason")
    .optional()
    .isString()
    .isLength({ max: 300 })
    .withMessage("Reason must be up to 300 characters"),
];
