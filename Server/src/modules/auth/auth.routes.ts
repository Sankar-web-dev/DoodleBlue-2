import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import User, { IUser } from "./user.model";
import Role, { IPermission } from "../role/role.model";
import { authenticate } from "./auth.middleware";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "LOGIN_RATE_LIMITED",
      message: "Too many login attempts. Try again later",
    },
  },
});

const loginSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1),
}).strict();

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10).max(128),
}).strict();

/** Build the safe user payload including the role's permission matrix. */
async function safeUser(user: IUser) {
  let permissions: IPermission[] = [];

  if (user.role !== "SUPER_ADMIN" && user.roleId) {
    const role = await Role.findById(user.roleId).lean();
    permissions = (role?.permissions as IPermission[]) ?? [];
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    roleId: user.roleId?.toString(),
    image: user.image,
    mustChangePassword: user.mustChangePassword,
    isActive: user.isActive,
    permissions,
  };
}

function regenerateSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

function saveSession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) reject(error);
      else resolve();
    });
  });
}

/**
 * @openapi
 * /api/v1/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in
 *     description: >-
 *       Verifies credentials and sets an HttpOnly session cookie.
 *       Rate-limited to 10 attempts per 15 minutes per IP.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 1 }
 *     responses:
 *       200:
 *         description: Signed in — session cookie set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/AuthUser' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401:
 *         description: Invalid credentials or inactive account
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 */
router.post(
  "/login",
  loginLimiter,
  async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Provide a valid email and password",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
      return;
    }

    const { email, password } = parsed.data;

    const user = await User.findOne({ email }).select("+passwordHash");

    if (
      !user ||
      !user.isActive ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      res.status(401).json({
        success: false,
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid email or password",
        },
      });
      return;
    }

    // Rotate the session after successful authentication.
    await regenerateSession(req);

    req.session.userId = user._id.toString();

    // Persist before returning, so the next request can use the session.
    await saveSession(req);

    res.status(200).json({
      success: true,
      data: {
        user: await safeUser(user),
      },
    });
  }
);

/**
 * @openapi
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out
 *     description: Destroys the session and clears the session cookie.
 *     responses:
 *       200:
 *         description: Logged out
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string, example: "Logged out successfully" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post(
  "/logout",
  authenticate,
  async (req: Request, res: Response) => {
    const cookieName = process.env.SESSION_COOKIE_NAME || "sms.sid";
    const isProduction = process.env.NODE_ENV === "production";
    const sameSite =
      process.env.SESSION_SAME_SITE === "none" ? "none" : "lax";

    await new Promise<void>((resolve, reject) => {
      req.session.destroy((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: isProduction,
      sameSite,
    });

    res.status(200).json({
      success: true,
      data: {
        message: "Logged out successfully",
      },
    });
  }
);

/**
 * @openapi
 * /api/v1/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Current session user
 *     description: >-
 *       Returns the logged-in user with their role's permission matrix.
 *       Permissions are empty for SUPER_ADMIN (implicitly all).
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/AuthUser' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get(
  "/me",
  authenticate,
  async (_req: Request, res: Response) => {
    const user = res.locals.currentUser as IUser;

    res.status(200).json({
      success: true,
      data: {
        user: await safeUser(user),
      },
    });
  }
);

/**
 * @openapi
 * /api/v1/auth/change-password:
 *   patch:
 *     tags: [Auth]
 *     summary: Change password
 *     description: >-
 *       Changes the current user's password, clears `mustChangePassword`,
 *       and rotates the session.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword: { type: string, minLength: 10, maxLength: 128 }
 *     responses:
 *       200:
 *         description: Password changed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string }
 *       400:
 *         description: Wrong current password / unchanged / invalid input
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.patch(
  "/change-password",
  authenticate,
  async (req: Request, res: Response) => {
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid password input",
          details: parsed.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
      });
      return;
    }

    const { currentPassword, newPassword } = parsed.data;
    const currentUser = res.locals.currentUser as IUser;

    const user = await User.findById(currentUser._id)
      .select("+passwordHash");

    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: {
          code: "SESSION_INVALID",
          message: "Please log in again",
        },
      });
      return;
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!passwordMatches) {
      res.status(400).json({
        success: false,
        error: {
          code: "INCORRECT_CURRENT_PASSWORD",
          message: "Current password is incorrect",
        },
      });
      return;
    }

    if (currentPassword === newPassword) {
      res.status(400).json({
        success: false,
        error: {
          code: "PASSWORD_UNCHANGED",
          message: "Choose a different password",
        },
      });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    await user.save();

    // Rotate the session after a credential change.
    await regenerateSession(req);
    req.session.userId = user._id.toString();
    await saveSession(req);

    res.status(200).json({
      success: true,
      data: {
        message: "Password changed successfully",
      },
    });
  }
);

export default router;
