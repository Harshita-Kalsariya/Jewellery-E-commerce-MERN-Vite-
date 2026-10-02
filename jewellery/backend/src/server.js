import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
let server;

const startServer = async () => {
  try {
    await connectDB();
    server = app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

process.on("unhandledRejection", (error) => {
  // eslint-disable-next-line no-console
  console.error(`Unhandled rejection: ${error.message}`);
});

process.on("uncaughtException", (error) => {
  // eslint-disable-next-line no-console
  console.error(`Uncaught exception: ${error.message}`);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

await startServer();
