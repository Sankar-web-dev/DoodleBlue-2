import Role from "../modules/role/role.model";
import User from "../modules/auth/user.model";

/**
 * Upsert the two system roles that the application relies on at runtime.
 *
 * - ADMIN  — full access except role management; used by admin accounts.
 * - STUDENT — read-only portal access; used by student accounts.
 *
 * Both roles have `isSystem: true` so they cannot be deleted through the API.
 * Their permissions CAN be edited by SUPER_ADMIN if the institution needs to
 * customise the defaults.
 *
 * Call this once after the MongoDB connection is established.
 */
export async function seedSystemRoles(): Promise<void> {
  await Promise.all([
    Role.findOneAndUpdate(
      { name: "ADMIN", isSystem: true },
      {
        $setOnInsert: {
          name: "ADMIN",
          description: "Full administrative access to all resources",
          isSystem: true,
          isActive: true,
          permissions: [
            { resource: "students",    actions: ["create", "read", "update", "delete"] },
            { resource: "courses",     actions: ["create", "read", "update", "delete"] },
            { resource: "departments", actions: ["create", "read", "update", "delete"] },
            { resource: "enrollments", actions: ["create", "read", "update", "delete"] },
            { resource: "analytics",   actions: ["read"] },
            { resource: "attendance",  actions: ["create", "read", "update", "delete"] },
          ],
        },
      },
      { upsert: true, new: true }
    ),

    Role.findOneAndUpdate(
      { name: "STUDENT", isSystem: true },
      {
        $setOnInsert: {
          name: "STUDENT",
          description: "Student portal access — read-only course, enrollment, and attendance data",
          isSystem: true,
          isActive: true,
          permissions: [
            { resource: "courses",     actions: ["read"] },
            { resource: "enrollments", actions: ["read"] },
            { resource: "attendance",  actions: ["read"] },
          ],
        },
      },
      { upsert: true, new: true }
    ),
  ]);

  console.log("System roles seeded (ADMIN, STUDENT)");

  // Backfill: existing users created before roleId existed get linked to the
  // matching system role so their permissions keep working.
  const [adminRole, studentRole] = await Promise.all([
    Role.findOne({ name: "ADMIN", isSystem: true }).select("_id").lean(),
    Role.findOne({ name: "STUDENT", isSystem: true }).select("_id").lean(),
  ]);

  if (adminRole) {
    await User.updateMany(
      { role: "ADMIN", roleId: { $exists: false } },
      { $set: { roleId: adminRole._id } }
    );
  }
  if (studentRole) {
    await User.updateMany(
      { role: "STUDENT", roleId: { $exists: false } },
      { $set: { roleId: studentRole._id } }
    );
  }
}
