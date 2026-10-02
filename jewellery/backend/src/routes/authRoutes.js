import express from "express";
import { changePassword, forgotPassword, getProfile, login, logout, register, resetPassword } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import validate from "../middleware/validateMiddleware.js";
import {
  forgotPasswordValidation,
  loginValidation,
  registerValidation,
  changePasswordValidation,
  resetPasswordValidation,
} from "../validators/authValidators.js";

const router = express.Router();

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPasswordValidation, validate, forgotPassword);
router.post("/reset-password/:token", resetPasswordValidation, validate, resetPassword);
router.put("/change-password", protect, changePasswordValidation, validate, changePassword);
router.get("/profile", protect, getProfile);

export default router;
