import { body, param } from "express-validator";

export const registerValidation = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["buyer", "admin"]).withMessage("Role must be buyer or admin"),
  body("adminKey")
    .optional()
    .isString()
    .withMessage("Admin key must be valid"),
];

export const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  body("role").optional().isIn(["buyer", "admin"]).withMessage("Role must be buyer or admin"),
];

export const forgotPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];

export const resetPasswordValidation = [
  param("token").isString().notEmpty().withMessage("Token is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

export const changePasswordValidation = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
];
