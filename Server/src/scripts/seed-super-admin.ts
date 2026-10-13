import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../modules/auth/user.model";
import "../config/dns";

dotenv.config({ path: [".env.local", ".env"] });

async function seedSuperAdmin(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const name = process.env.SUPER_ADMIN_NAME;
    const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!mongoUri || !name || !email || !password) {
      throw new Error(
        "Set MONGODB_URI, SUPER_ADMIN_NAME, " +
        "SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD"
      );
    }

    if (password.length < 10) {
      throw new Error("Super Admin password must be at least 10 characters");
    }

    await mongoose.connect(mongoUri);

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      if (existingUser.role !== "SUPER_ADMIN") {
        throw new Error(
          "This email already belongs to a non-Super Admin account"
        );
      }

      console.log("Super Admin already exists. No changes made.");
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await User.create({
      name,
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      mustChangePassword: false,
      isActive: true,
    });

    console.log("Super Admin created successfully.");
  } finally {
    await mongoose.disconnect();
  }
}

seedSuperAdmin().catch((error: unknown) => {
  console.error(
    "Super Admin seed failed:",
    error instanceof Error ? error.message : error
  );

  process.exitCode = 1;
});