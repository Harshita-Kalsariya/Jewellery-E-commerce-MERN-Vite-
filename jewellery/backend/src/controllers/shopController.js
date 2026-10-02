import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import catchAsync from "../utils/catchAsync.js";

const RETURN_EXCHANGE_WINDOW_DAYS = 10;

const isWithinReturnExchangeWindow = (referenceDate) => {
  if (!referenceDate) return false;
  const dateMs = new Date(referenceDate).getTime();
  if (Number.isNaN(dateMs)) return false;
  return Date.now() - dateMs <= RETURN_EXCHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
};

export const getCart = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  res.json({ success: true, cart: cart || { items: [] } });
});

export const upsertCartItem = catchAsync(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  const existing = cart.items.find((i) => i.product.toString() === req.body.productId);
  const qty = Number(req.body.qty) || 1;
  const mode = req.body.mode || "set";
  if (existing) {
    existing.qty = mode === "increment" ? Math.min(20, (Number(existing.qty) || 1) + qty) : qty;
  } else {
    cart.items.push({ product: req.body.productId, qty });
  }
  await cart.save();
  res.json({ success: true, cart });
});

export const removeCartItem = catchAsync(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) throw new Error("Cart not found");
  cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
  await cart.save();
  res.json({ success: true, cart });
});

export const getWishlist = catchAsync(async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user._id }).populate("products");
  res.json({ success: true, wishlist: wishlist || { products: [] } });
});

export const toggleWishlist = catchAsync(async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user._id });
  if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });
  const index = wishlist.products.findIndex((id) => id.toString() === req.body.productId);
  if (index > -1) wishlist.products.splice(index, 1);
  else wishlist.products.push(req.body.productId);
  await wishlist.save();
  res.json({ success: true, wishlist });
});

export const createOrder = catchAsync(async (req, res) => {
  const order = await Order.create({ ...req.body, user: req.user._id });

  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    const orderedQtyByProduct = new Map();
    (req.body.items || []).forEach((item) => {
      const productId = String(item.product || "");
      if (!productId) return;
      const qty = Number(item.qty) || 1;
      orderedQtyByProduct.set(productId, (orderedQtyByProduct.get(productId) || 0) + qty);
    });

    cart.items = cart.items.reduce((nextItems, cartItem) => {
      const productId = cartItem.product.toString();
      const orderedQty = orderedQtyByProduct.get(productId) || 0;
      if (orderedQty <= 0) {
        nextItems.push(cartItem);
        return nextItems;
      }

      const remainingQty = (Number(cartItem.qty) || 1) - orderedQty;
      if (remainingQty > 0) {
        cartItem.qty = remainingQty;
        nextItems.push(cartItem);
      }
      return nextItems;
    }, []);

    await cart.save();
  }

  res.status(201).json({ success: true, order });
});

export const aiRecommendations = catchAsync(async (req, res) => {
  const userOrders = await Order.find({ user: req.user._id });
  const preferred = userOrders.flatMap((o) => o.items.map((i) => i.name.toLowerCase()));
  const products = await Product.find({}).limit(20);
  const recommended = products
    .map((p) => ({ score: preferred.some((name) => p.name.toLowerCase().includes(name.split(" ")[0])) ? 2 : 1, product: p }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((item) => item.product);
  res.json({ success: true, recommended });
});

export const adminOverview = catchAsync(async (req, res) => {
  const [userCount, orderCount, productCount, paidRevenueAgg, paidOrders, paymentPending, refundPending, refundedAmountAgg] =
    await Promise.all([
    User.countDocuments(),
    Order.countDocuments(),
    Product.countDocuments(),
    Order.aggregate([
      { $match: { "paymentResult.status": "paid" } },
      { $group: { _id: null, revenue: { $sum: { $ifNull: ["$totalPrice", 0] } } } },
    ]),
    Order.countDocuments({ "paymentResult.status": "paid" }),
    Order.countDocuments({ "paymentResult.status": "pending" }),
    Order.countDocuments({ "paymentResult.status": "refund_pending" }),
    Order.aggregate([
      { $match: { "paymentResult.status": "refunded" } },
      { $group: { _id: null, refunded: { $sum: { $ifNull: ["$totalPrice", 0] } } } },
    ]),
  ]);
  const grossRevenueAgg = await Order.aggregate([{ $group: { _id: null, revenue: { $sum: { $ifNull: ["$totalPrice", 0] } } } }]);
  const paidRevenue = paidRevenueAgg[0]?.revenue || 0;
  const grossRevenue = grossRevenueAgg[0]?.revenue || 0;
  const refundedAmount = refundedAmountAgg[0]?.refunded || 0;
  const revenue = paidRevenue;
  const netRevenue = grossRevenue - refundedAmount;
  const netCashflow = paidRevenue - refundedAmount;
  res.json({
    success: true,
    metrics: {
      users: userCount,
      orders: orderCount,
      products: productCount,
      revenue,
      netRevenue,
      netCashflow,
      paidOrders,
      paymentPending,
      refundPending,
      refundedAmount,
    },
  });
});

export const adminTransactionReport = catchAsync(async (req, res) => {
  const days = Math.min(60, Math.max(7, Number(req.query.days) || 14));
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const [dailyRevenueRows, paymentStatusRows, orderStatusRows, methodRows, totalsRows] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: start } } },
      {
        $group: {
          _id: {
            y: { $year: "$createdAt" },
            m: { $month: "$createdAt" },
            d: { $dayOfMonth: "$createdAt" },
          },
          orders: { $sum: 1 },
          grossAmount: { $sum: { $ifNull: ["$totalPrice", 0] } },
          paidAmount: {
            $sum: {
              $cond: [{ $eq: ["$paymentResult.status", "paid"] }, { $ifNull: ["$totalPrice", 0] }, 0],
            },
          },
          refundedAmount: {
            $sum: {
              $cond: [{ $eq: ["$paymentResult.status", "refunded"] }, { $ifNull: ["$totalPrice", 0] }, 0],
            },
          },
        },
      },
      { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
    ]),
    Order.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$paymentResult.status", "pending"] },
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ["$totalPrice", 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Order.aggregate([
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Order.aggregate([
      {
        $group: {
          _id: { $ifNull: ["$paymentMethod", "unknown"] },
          count: { $sum: 1 },
          amount: { $sum: { $ifNull: ["$totalPrice", 0] } },
        },
      },
      { $sort: { amount: -1 } },
    ]),
    Order.aggregate([
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          grossSales: { $sum: { $ifNull: ["$totalPrice", 0] } },
          paidSales: {
            $sum: {
              $cond: [{ $eq: ["$paymentResult.status", "paid"] }, { $ifNull: ["$totalPrice", 0] }, 0],
            },
          },
          refundSales: {
            $sum: {
              $cond: [{ $eq: ["$paymentResult.status", "refunded"] }, { $ifNull: ["$totalPrice", 0] }, 0],
            },
          },
        },
      },
    ]),
  ]);

  const byDate = new Map();
  dailyRevenueRows.forEach((row) => {
    const key = `${row._id.y}-${String(row._id.m).padStart(2, "0")}-${String(row._id.d).padStart(2, "0")}`;
    byDate.set(key, row);
  });

  const daily = [];
  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    const row = byDate.get(key);
    daily.push({
      date: key,
      orders: row?.orders || 0,
      grossAmount: row?.grossAmount || 0,
      paidAmount: row?.paidAmount || 0,
      refundedAmount: row?.refundedAmount || 0,
      netAmount: (row?.paidAmount || 0) - (row?.refundedAmount || 0),
    });
  }

  const totals = totalsRows[0] || { totalOrders: 0, grossSales: 0, paidSales: 0, refundSales: 0 };

  res.json({
    success: true,
    report: {
      periodDays: days,
      daily,
      paymentStatus: paymentStatusRows.map((r) => ({ status: r._id, count: r.count, amount: r.amount })),
      orderStatus: orderStatusRows.map((r) => ({ status: r._id, count: r.count })),
      paymentMethods: methodRows.map((r) => ({ method: r._id, count: r.count, amount: r.amount })),
      totals: {
        totalOrders: totals.totalOrders || 0,
        grossSales: totals.grossSales || 0,
        paidSales: totals.paidSales || 0,
        refundSales: totals.refundSales || 0,
        netSales: (totals.grossSales || 0) - (totals.refundSales || 0),
        netCashflow: (totals.paidSales || 0) - (totals.refundSales || 0),
      },
    },
  });
});

export const adminListOrders = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const search = String(req.query.search || "").trim();
  const skip = (page - 1) * limit;

  let filter = {};
  if (search) {
    if (mongoose.Types.ObjectId.isValid(search) && search.length === 24) {
      filter._id = search;
    } else {
      const userIds = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).distinct("_id");
      if (userIds.length) {
        filter.user = { $in: userIds };
      } else {
        filter._id = { $in: [] };
      }
    }
  }

  const [orders, total] = await Promise.all([
    Order.find(filter).populate("user", "name email role").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Order.countDocuments(filter),
  ]);

  const pages = Math.max(1, Math.ceil(total / limit));
  res.json({
    success: true,
    orders,
    pagination: { page, limit, total, pages },
  });
});

export const adminUsers = catchAsync(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const search = String(req.query.search || "").trim();
  const skip = (page - 1) * limit;

  const filter = search
    ? {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    User.find(filter).select("-password").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const pages = Math.max(1, Math.ceil(total / limit));
  res.json({
    success: true,
    users,
    pagination: { page, limit, total, pages },
  });
});

export const adminDeleteUser = catchAsync(async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "User deleted" });
});

export const adminCreateProduct = catchAsync(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json({ success: true, product });
});

export const adminUpdateProduct = catchAsync(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, product });
});

export const adminDeleteProduct = catchAsync(async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: "Product deleted" });
});

export const adminUpdateOrderStatus = catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  order.orderStatus = req.body.orderStatus;
  if (req.body.orderStatus === "delivered" && !order.deliveredAt) {
    order.deliveredAt = new Date();
  }
  if (req.body.orderStatus === "exchanged" && !order.exchangedAt) {
    order.exchangedAt = new Date();
    order.exchangeCount = Math.max(1, Number(order.exchangeCount) || 0);
  }
  if (["delivered", "exchanged"].includes(req.body.orderStatus) && order.paymentMethod === "cod") {
    order.paymentResult = {
      ...(order.paymentResult || {}),
      status: "paid",
      paidAt: order.paymentResult?.paidAt || new Date(),
    };
  }
  if (req.body.orderStatus === "returned") {
    order.paymentResult = {
      ...(order.paymentResult || {}),
      status: "refunded",
    };
  }
  await order.save();
  res.json({ success: true, order });
});

export const requestOrderCancel = catchAsync(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.orderStatus !== "pending") {
    res.status(400);
    throw new Error("Cancellation allowed only before shipping");
  }
  order.orderStatus = "cancelled";
  order.cancelledAt = new Date();
  order.cancellationReason = (req.body.reason || "").trim();
  await order.save();
  res.json({ success: true, message: "Order cancelled successfully", order });
});

export const requestOrderReturn = catchAsync(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!["delivered", "exchanged"].includes(order.orderStatus)) {
    res.status(400);
    throw new Error("Return is allowed only for delivered or exchanged orders");
  }
  const returnWindowDate = order.exchangedAt || order.deliveredAt;
  if (!isWithinReturnExchangeWindow(returnWindowDate)) {
    res.status(400);
    throw new Error("Return window is 10 days after delivery");
  }
  order.orderStatus = "return_requested";
  order.returnRequestedAt = new Date();
  order.returnReason = (req.body.reason || "").trim();
  order.paymentResult = {
    ...(order.paymentResult || {}),
    status: "refund_pending",
  };
  await order.save();
  res.json({ success: true, message: "Return request submitted", order });
});

export const requestOrderExchange = catchAsync(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!["delivered", "exchanged"].includes(order.orderStatus)) {
    res.status(400);
    throw new Error("Exchange is allowed only after delivery");
  }
  if ((Number(order.exchangeCount) || 0) >= 1 || order.orderStatus === "exchanged") {
    res.status(400);
    throw new Error("Only one exchange is allowed per order");
  }
  const exchangeWindowDate = order.exchangedAt || order.deliveredAt;
  if (!isWithinReturnExchangeWindow(exchangeWindowDate)) {
    res.status(400);
    throw new Error("Exchange window is 10 days after delivery");
  }
  order.orderStatus = "exchange_requested";
  order.exchangeRequestedAt = new Date();
  order.exchangeReason = (req.body.reason || "").trim();
  await order.save();
  res.json({ success: true, message: "Exchange request submitted", order });
});
