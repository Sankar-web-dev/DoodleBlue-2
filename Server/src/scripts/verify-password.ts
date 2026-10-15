import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../modules/auth/user.model";

const [email, password] = process.argv.slice(2);

async function main() {
  if (!email || !password) {
    console.log("usage: tsx verify-password.ts <email> <password>");
    return;
  }
  await mongoose.connect(process.env.MONGODB_URI!);
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash"
  );
  if (!user) {
    console.log("USER NOT FOUND:", email);
    return;
  }
  console.log("match:", await bcrypt.compare(password, user.passwordHash));
  console.log(
    "mustChangePassword:",
    user.mustChangePassword,
    "| isActive:",
    user.isActive
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
