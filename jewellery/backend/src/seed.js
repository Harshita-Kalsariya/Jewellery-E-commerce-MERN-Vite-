import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Product from "./models/Product.js";
import seedProducts from "./data/seedProducts.js";

dotenv.config();
await connectDB();
await Product.deleteMany({});
await Product.insertMany(seedProducts);
// eslint-disable-next-line no-console
console.log("Products seeded");
process.exit(0);
