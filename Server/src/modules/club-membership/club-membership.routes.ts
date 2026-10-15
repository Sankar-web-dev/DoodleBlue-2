import { Router } from "express";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from "../auth/auth.middleware";
import * as MembershipController from "./club-membership.controller";

const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);

/**
 * @openapi
 * /api/v1/club-memberships:
 *   post:
 *     tags: [Club Memberships]
 *     summary: Add a member to a club
 *     description: >-
 *       Requires `clubMemberships:create`. Memberships start `PENDING` —
 *       a SUPER_ADMIN must approve them. `membershipRole` is club-scoped
 *       (`MEMBER`/`COORDINATOR`), separate from the user's global role.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clubId, studentId]
 *             properties:
 *               clubId: { type: string }
 *               studentId: { type: string }
 *               membershipRole:
 *                 type: string
 *                 enum: [MEMBER, COORDINATOR]
 *                 default: MEMBER
 *     responses:
 *       201:
 *         description: Membership created (PENDING approval)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     membership: { $ref: '#/components/schemas/ClubMembership' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { description: Club or user not found / club inactive }
 *       409: { description: User already belongs to this club }
 */
router.post(
  "/",
  authorize("clubMemberships", "create"),
  MembershipController.createMembership
);

/**
 * @openapi
 * /api/v1/club-memberships:
 *   get:
 *     tags: [Club Memberships]
 *     summary: List memberships
 *     description: >-
 *       Requires `clubMemberships:read`. Non-super-admins are scoped to
 *       memberships in their own clubs.
 *     parameters:
 *       - { $ref: '#/components/parameters/PageQuery' }
 *       - { $ref: '#/components/parameters/LimitQuery' }
 *       - { in: query, name: clubId, schema: { type: string } }
 *       - { in: query, name: studentId, schema: { type: string } }
 *       - { in: query, name: membershipRole, schema: { type: string, enum: [MEMBER, COORDINATOR] } }
 *       - { in: query, name: status, schema: { type: string, enum: [PENDING, ACTIVE, INACTIVE] } }
 *     responses:
 *       200:
 *         description: Paginated memberships
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
 *                       items: { $ref: '#/components/schemas/ClubMembership' }
 *                     meta: { $ref: '#/components/schemas/Meta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/",
  authorize("clubMemberships", "read"),
  MembershipController.listMemberships
);

// Self-scoped read — no resource permission needed; the caller only ever
// sees their own memberships. Must precede /:id.
/**
 * @openapi
 * /api/v1/club-memberships/me:
 *   get:
 *     tags: [Club Memberships]
 *     summary: My memberships
 *     description: >-
 *       Any authenticated user — returns only the caller's own memberships
 *       (populated clubs). No resource permission required.
 *     responses:
 *       200:
 *         description: Caller's memberships
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ClubMembership' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get("/me", MembershipController.listMyMemberships);

/**
 * @openapi
 * /api/v1/club-memberships/{id}:
 *   get:
 *     tags: [Club Memberships]
 *     summary: Get a membership
 *     description: Requires `clubMemberships:read` (scoped for non-super-admins).
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200:
 *         description: The membership
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     membership: { $ref: '#/components/schemas/ClubMembership' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  "/:id",
  authorize("clubMemberships", "read"),
  MembershipController.getMembership
);

/**
 * @openapi
 * /api/v1/club-memberships/{id}/approve:
 *   patch:
 *     tags: [Club Memberships]
 *     summary: Approve a membership
 *     description: SUPER_ADMIN only — moves `PENDING` → `ACTIVE`.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200:
 *         description: Membership activated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     membership: { $ref: '#/components/schemas/ClubMembership' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Membership is not pending }
 */
router.patch(
  "/:id/approve",
  authorize("clubMemberships", "update"),
  MembershipController.approveMembership
);

/**
 * @openapi
 * /api/v1/club-memberships/{id}:
 *   patch:
 *     tags: [Club Memberships]
 *     summary: Update a membership
 *     description: >-
 *       Requires `clubMemberships:update`. Change the member's club role or
 *       lifecycle status.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               membershipRole: { type: string, enum: [MEMBER, COORDINATOR] }
 *               status: { type: string, enum: [PENDING, ACTIVE, INACTIVE] }
 *     responses:
 *       200:
 *         description: Updated membership
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     membership: { $ref: '#/components/schemas/ClubMembership' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch(
  "/:id",
  authorize("clubMemberships", "update"),
  MembershipController.updateMembership
);

/**
 * @openapi
 * /api/v1/club-memberships/{id}:
 *   delete:
 *     tags: [Club Memberships]
 *     summary: Remove a member
 *     description: Requires `clubMemberships:delete`.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200: { description: Membership removed }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete(
  "/:id",
  authorize("clubMemberships", "delete"),
  MembershipController.deleteMembership
);

export default router;
