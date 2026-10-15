import { Router } from "express";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from "../auth/auth.middleware";
import { uploadProfileImage } from "../../lib/upload";
import * as UsersController from "./users.controller";

// User-account provisioning — SUPER_ADMIN (or any role granted users:*).
const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);

/**
 * @openapi
 * /api/v1/users:
 *   post:
 *     tags: [Users]
 *     summary: Create a user
 *     description: >-
 *       Requires `users:create`. If `password` is omitted a temporary one is
 *       generated and emailed to the user (requires SMTP) — they must change
 *       it on first login. `roleId` must reference an active custom role.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, roleId]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 80 }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 10, maxLength: 128 }
 *               roleId: { type: string, description: "ObjectId of a Role" }
 *               image: { type: string, description: "Profile image URL or uploaded path" }
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { description: Email already in use }
 */
router.post("/", authorize("users", "create"), UsersController.createUser);

/**
 * @openapi
 * /api/v1/users/upload-avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload a profile image
 *     description: >-
 *       Requires `users:create`. Multipart upload — returns a relative path
 *       (`/uploads/profiles/…`) to pass as `image` when creating/updating a user.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Uploaded file path
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     path: { type: string, example: "/uploads/profiles/profile-1.jpg" }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post(
  "/upload-avatar",
  authorize("users", "create"),
  uploadProfileImage.single("avatar"),
  UsersController.uploadAvatar
);

/**
 * @openapi
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: List users
 *     description: Requires `users:read`.
 *     parameters:
 *       - { $ref: '#/components/parameters/PageQuery' }
 *       - { $ref: '#/components/parameters/LimitQuery' }
 *       - { in: query, name: search, schema: { type: string }, description: "Name or email" }
 *     responses:
 *       200:
 *         description: Paginated users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/User' }
 *                     meta: { $ref: '#/components/schemas/Meta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", authorize("users", "read"), UsersController.listUsers);

// Picker list — the controller applies its own multi-permission check.
// Must precede /:id.
/**
 * @openapi
 * /api/v1/users/options:
 *   get:
 *     tags: [Users]
 *     summary: Minimal user options for select pickers
 *     description: >-
 *       Lightweight `{id, name, email, role, isActive}` list. Allowed for
 *       callers with `users:read`, `clubs:create/update`, or
 *       `clubMemberships:create`. Super-admin accounts are hidden from
 *       non-super-admins.
 *     responses:
 *       200:
 *         description: User options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/UserOption' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/options", UsersController.listUserOptions);

/**
 * @openapi
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a user
 *     description: Requires `users:read`.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200:
 *         description: The user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", authorize("users", "read"), UsersController.getUser);

/**
 * @openapi
 * /api/v1/users/{id}:
 *   patch:
 *     tags: [Users]
 *     summary: Update a user
 *     description: >-
 *       Requires `users:update`. `image: null` removes the profile image.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 80 }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 10, maxLength: 128 }
 *               roleId: { type: string }
 *               image: { type: string, nullable: true }
 *               isActive: { type: "boolean" }
 *     responses:
 *       200:
 *         description: Updated user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user: { $ref: '#/components/schemas/User' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/:id", authorize("users", "update"), UsersController.updateUser);

/**
 * @openapi
 * /api/v1/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete a user
 *     description: Requires `users:delete`.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200: { description: User deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:id", authorize("users", "delete"), UsersController.deleteUser);

export default router;
