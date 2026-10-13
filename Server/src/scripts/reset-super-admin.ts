import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../modules/auth/user.model";
import "../config/dns";

dotenv.config({ path: [".env.local", ".env"] });

async function resetSuperAdmin(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;
    const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!mongoUri || !email || !password) {
      throw new Error(
        "Set MONGODB_URI, SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD"
      );
    }

    if (password.length < 10) {
      throw new Error("Super Admin password must be at least 10 characters");
    }

    await mongoose.connect(mongoUri);

    const user = await User.findOne({ email }).select("+passwordHash");

    if (!user) {
      throw new Error(
        "No user found with SUPER_ADMIN_EMAIL. Run pnpm seed:super-admin first."
      );
    }

    if (user.role !== "SUPER_ADMIN") {
      throw new Error(
        "This email belongs to a non-Super Admin account"
      );
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.mustChangePassword = false;
    user.isActive = true;
    await user.save();

    console.log("Super Admin password reset to SUPER_ADMIN_PASSWORD.");
  } finally {
    await mongoose.disconnect();
  }
}

resetSuperAdmin().catch((error: unknown) => {
  console.error(
    "Super Admin reset failed:",
    error instanceof Error ? error.message : error
  );

  process.exitCode = 1;
});
