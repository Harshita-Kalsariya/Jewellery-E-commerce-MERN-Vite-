import Product from "../models/Product.js";
import catchAsync from "../utils/catchAsync.js";

export const getProducts = catchAsync(async (req, res) => {
  const {
    search = "",
    category,
    material,
    purity,
    minPrice,
    maxPrice,
    sort = "-createdAt",
    page: pageRaw,
    limit: limitRaw,
  } = req.query;

  const query = {};
  const s = String(search || "").trim();
  if (s) {
    query.$or = [
      { name: { $regex: s, $options: "i" } },
      { category: { $regex: s, $options: "i" } },
    ];
  }
  if (category) query.category = category;
  if (material) query.material = material;
  if (purity) query.purity = purity;
  if (minPrice || maxPrice) {
    query.price = { $gte: Number(minPrice || 0), $lte: Number(maxPrice || 99999999) };
  }

  const pageNum = Math.max(1, parseInt(pageRaw, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limitRaw, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const [products, total] = await Promise.all([
    Product.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
    Product.countDocuments(query),
  ]);

  const pages = Math.max(1, Math.ceil(total / limitNum));

  res.json({
    success: true,
    count: products.length,
    products,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages,
    },
  });
});

export const getProductBySlug = catchAsync(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) throw new Error("Product not found");
  res.json({ success: true, product });
});

export const createReview = catchAsync(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new Error("Product not found");
  const existing = product.reviews.find((r) => r.user.toString() === req.user._id.toString());
  if (existing) throw new Error("You already reviewed this product");
  product.reviews.push({ user: req.user._id, name: req.user.name, rating: req.body.rating, comment: req.body.comment });
  product.numReviews = product.reviews.length;
  product.rating = product.reviews.reduce((acc, item) => acc + item.rating, 0) / product.numReviews;
  await product.save();
  res.status(201).json({ success: true, message: "Review added" });
});
