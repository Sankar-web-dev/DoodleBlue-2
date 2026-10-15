import { Router } from "express";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from "../auth/auth.middleware";
import { uploadClubImage } from "../../lib/upload";
import * as ClubController from "./club.controller";

const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);

/**
 * @openapi
 * /api/v1/clubs:
 *   post:
 *     tags: [Clubs]
 *     summary: Create a club
 *     description: >-
 *       Requires `clubs:create`. New clubs start inactive — a SUPER_ADMIN
 *       must approve them via `PATCH /clubs/{id}/approve` before they can
 *       take members or events.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, department, facultyCoordinatorId]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 80 }
 *               description: { type: string, maxLength: 500 }
 *               department: { type: string, minLength: 2, maxLength: 80 }
 *               logoUrl: { type: string, description: "Uploaded path or external URL" }
 *               facultyCoordinatorId: { type: string }
 *     responses:
 *       201:
 *         description: Club created (inactive pending approval)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     club: { $ref: '#/components/schemas/Club' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { description: A club with this name already exists }
 */
router.post("/", authorize("clubs", "create"), ClubController.createClub);

/**
 * @openapi
 * /api/v1/clubs/upload-image:
 *   post:
 *     tags: [Clubs]
 *     summary: Upload a club logo
 *     description: >-
 *       Requires `clubs:create`. Multipart upload — returns a relative path
 *       (`/uploads/clubs/…`) to pass as `logoUrl`.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image: { type: string, format: binary }
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
 *                     path: { type: string, example: "/uploads/clubs/club-1.jpg" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post(
  "/upload-image",
  authorize("clubs", "create"),
  uploadClubImage.single("image"),
  ClubController.uploadClubImage
);

/**
 * @openapi
 * /api/v1/clubs:
 *   get:
 *     tags: [Clubs]
 *     summary: List clubs
 *     description: >-
 *       Requires `clubs:read`. SUPER_ADMIN sees every club; other roles see
 *       only clubs they created, faculty-coordinate, or actively belong to.
 *     parameters:
 *       - { $ref: '#/components/parameters/PageQuery' }
 *       - { $ref: '#/components/parameters/LimitQuery' }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: department, schema: { type: string } }
 *       - { in: query, name: isActive, schema: { type: string, enum: ["true", "false"] } }
 *     responses:
 *       200:
 *         description: Paginated clubs
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
 *                       items: { $ref: '#/components/schemas/Club' }
 *                     meta: { $ref: '#/components/schemas/Meta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", authorize("clubs", "read"), ClubController.listClubs);

/**
 * @openapi
 * /api/v1/clubs/{id}:
 *   get:
 *     tags: [Clubs]
 *     summary: Get a club
 *     description: >-
 *       Requires `clubs:read`. Invisible clubs (not yours / not a member)
 *       return 404 for non-super-admins.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200:
 *         description: The club
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     club: { $ref: '#/components/schemas/Club' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", authorize("clubs", "read"), ClubController.getClub);

/**
 * @openapi
 * /api/v1/clubs/{id}/approve:
 *   patch:
 *     tags: [Clubs]
 *     summary: Approve a club
 *     description: >-
 *       SUPER_ADMIN only — activates a pending club so it can take
 *       members and events.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200:
 *         description: Club activated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     club: { $ref: '#/components/schemas/Club' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch(
  "/:id/approve",
  authorize("clubs", "update"),
  ClubController.approveClub
);

/**
 * @openapi
 * /api/v1/clubs/{id}:
 *   patch:
 *     tags: [Clubs]
 *     summary: Update a club
 *     description: >-
 *       Requires `clubs:update`. Non-super-admins must be the club's
 *       faculty coordinator. `logoUrl: null` removes the logo.
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
 *               description: { type: string, maxLength: 500 }
 *               department: { type: string, minLength: 2, maxLength: 80 }
 *               logoUrl: { type: string, nullable: true }
 *               facultyCoordinatorId: { type: string }
 *               isActive: { type: "boolean" }
 *     responses:
 *       200:
 *         description: Updated club
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     club: { $ref: '#/components/schemas/Club' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/:id", authorize("clubs", "update"), ClubController.updateClub);

/**
 * @openapi
 * /api/v1/clubs/{id}:
 *   delete:
 *     tags: [Clubs]
 *     summary: Delete a club
 *     description: >-
 *       Requires `clubs:delete`. Non-super-admins must be the club's
 *       faculty coordinator.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200: { description: Club deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:id", authorize("clubs", "delete"), ClubController.deleteClub);

export default router;
