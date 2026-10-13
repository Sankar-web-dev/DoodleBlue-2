import dotenv from "dotenv";
import mongoose from "mongoose";
import Department from "../modules/department/department.model";
import "../config/dns";

dotenv.config({ path: [".env.local", ".env"] });

// Ensures at least one active department exists so ADMINs can enroll students
// without first creating one via the API. Idempotent — safe to run repeatedly.
async function seedDefaultDepartment(): Promise<void> {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("Set MONGODB_URI");
    }

    await mongoose.connect(mongoUri);

    const existing = await Department.findOne({ code: "GEN" });
    if (existing) {
      console.log(
        `Department already exists: ${existing.name} (GEN). No changes made.`
      );
      return;
    }

    const dept = await Department.create({
      name: "General",
      code: "GEN",
      isActive: true,
    });

    console.log(`Default department created: ${dept.name} (GEN)`);
  } finally {
    await mongoose.disconnect();
  }
}

seedDefaultDepartment().catch((error: unknown) => {
  console.error(
    "Department seed failed:",
    error instanceof Error ? error.message : error
  );

  process.exitCode = 1;
});
