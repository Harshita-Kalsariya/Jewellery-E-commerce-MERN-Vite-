import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing. Create backend/.env and set MONGO_URI.");
  }
  const conn = await mongoose.connect(process.env.MONGO_URI);
  // eslint-disable-next-line no-console
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

export default connectDB;
