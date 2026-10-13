import dotenv from "dotenv";
import mongoose from "mongoose";
import { createApp } from "./app";
import "./config/dns";

dotenv.config({ path: [".env.local", ".env"] });

async function startServer(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error("MONGODB_URI is missing");
    }

    await mongoose.connect(mongoUri);

    const app = createApp();
    const port = Number(process.env.PORT) || 5000;

    const server = app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
      console.log("MongoDB Atlas connected successfully");
    });

    const shutdown = async () => {
      server.close(async () => {
        await mongoose.disconnect();
        process.exit(0);
      });
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  } catch (error: unknown) {
    console.error(
      "Failed to start server:",
      error instanceof Error ? error.message : error
    );

    process.exit(1);
  }
}

startServer();