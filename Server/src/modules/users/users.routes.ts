import { Router, Request, Response } from "express";
import { z } from "zod";
import User, { IUser } from "../auth/user.model";
import { authenticate, authorize } from "../auth/auth.middleware";

// User-account listing — requires "users" read permission (SUPER_ADMIN only in practice).
const router = Router();

const listUsersQuerySchema = z.object({
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function safeUser(user: IUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    roleId: user.roleId?.toString(),
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/v1/users — list accounts (filterable by search)
router.get(
  "/",
  authenticate,
  authorize("users", "read"),
  async (req: Request, res: Response) => {
    const parsed = listUsersQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join(".") || "query",
            message: issue.message,
          })),
        },
      });
      return;
    }

    const { search, page, limit } = parsed.data;

    const filter: Record<string, unknown> = {};
    if (search) {
      const safe = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safe, $options: "i" } },
        { email: { $regex: safe, $options: "i" } },
      ];
    }

    const [total, docs] = await Promise.all([
      User.countDocuments(filter),
      User.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.status(200).json({
      success: true,
      data: { users: docs.map(safeUser) },
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }
);

export default router;
