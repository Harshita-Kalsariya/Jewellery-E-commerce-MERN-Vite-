import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Order from "../models/Order.js";
import catchAsync from "../utils/catchAsync.js";

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

const sendAuthResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieMaxAgeDays = Number(process.env.COOKIE_EXPIRES_DAYS || 7);
  res
    .cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: cookieMaxAgeDays * 24 * 60 * 60 * 1000,
    })
    .status(statusCode)
    .json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } });
};

export const register = catchAsync(async (req, res) => {
  const requestedRole = req.body.role || "buyer";
  if (!["buyer", "admin"].includes(requestedRole)) {
    res.status(400);
    throw new Error("Invalid role selected");
  }
  if (requestedRole === "admin") {
    if (!process.env.ADMIN_REGISTRATION_KEY || req.body.adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
      res.status(403);
      throw new Error("Invalid admin registration key");
    }
  }
  const existing = await User.findOne({ email: req.body.email });
  if (existing) {
    res.status(409);
    throw new Error("Email already registered");
  }
  const user = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: requestedRole,
  });
  sendAuthResponse(user, 201, res);
});

export const login = catchAsync(async (req, res) => {
  const { email, password, role } = req.body;
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }
  if (role && user.role !== role) {
    res.status(403);
    throw new Error(`This account is registered as ${user.role}, not ${role}`);
  }
  sendAuthResponse(user, 200, res);
});

export const logout = (req, res) => {
  res.clearCookie("token").json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = catchAsync(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  user.password = req.body.newPassword;
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  res.json({ success: true, message: "Password changed successfully. Please login with new password." });
});

export const resetPassword = catchAsync(async (req, res) => {
  const user = await User.findOne({ resetToken: req.params.token, resetTokenExpires: { $gt: Date.now() } });
  if (!user) throw new Error("Invalid or expired token");
  user.password = req.body.password;
  user.resetToken = undefined;
  user.resetTokenExpires = undefined;
  await user.save();
  sendAuthResponse(user, 200, res);
});

export const changePassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const isCurrentPasswordValid = await user.matchPassword(currentPassword);
  if (!isCurrentPasswordValid) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: "Password updated successfully" });
});

export const getProfile = catchAsync(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, user: req.user, orders });
});
