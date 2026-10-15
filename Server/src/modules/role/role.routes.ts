import { Router } from "express";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from "../auth/auth.middleware";
import * as RoleController from "./role.controller";

// Role management — SUPER_ADMIN only (they own the permission schema).
// Custom-role holders cannot modify the role definitions themselves.
const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);

/**
 * @openapi
 * /api/v1/roles:
 *   post:
 *     tags: [Roles]
 *     summary: Create a custom role
 *     description: Requires `roles:create` (SUPER_ADMIN in practice).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, permissions]
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 60, example: "Event Coordinator" }
 *               description: { type: string, maxLength: 200 }
 *               permissions:
 *                 type: array
 *                 minItems: 1
 *                 items: { $ref: '#/components/schemas/Permission' }
 *     responses:
 *       201:
 *         description: Role created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     role: { $ref: '#/components/schemas/Role' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { description: A role with this name already exists }
 */
router.post("/", authorize("roles", "create"), RoleController.createRole);

/**
 * @openapi
 * /api/v1/roles:
 *   get:
 *     tags: [Roles]
 *     summary: List roles
 *     description: Requires `roles:read`.
 *     parameters:
 *       - { $ref: '#/components/parameters/PageQuery' }
 *       - { $ref: '#/components/parameters/LimitQuery' }
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: isActive, schema: { type: string, enum: ["true", "false"] } }
 *     responses:
 *       200:
 *         description: Paginated roles — `data.data` is the page, `data.meta` the pagination
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
 *                       items: { $ref: '#/components/schemas/Role' }
 *                     meta: { $ref: '#/components/schemas/Meta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", authorize("roles", "read"), RoleController.listRoles);

/**
 * @openapi
 * /api/v1/roles/{id}:
 *   get:
 *     tags: [Roles]
 *     summary: Get a role
 *     description: Requires `roles:read`.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200:
 *         description: The role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     role: { $ref: '#/components/schemas/Role' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", authorize("roles", "read"), RoleController.getRole);

/**
 * @openapi
 * /api/v1/roles/{id}:
 *   patch:
 *     tags: [Roles]
 *     summary: Update a role
 *     description: Requires `roles:update`. At least one field required.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, minLength: 2, maxLength: 60 }
 *               description: { type: string, maxLength: 200 }
 *               permissions:
 *                 type: array
 *                 minItems: 1
 *                 items: { $ref: '#/components/schemas/Permission' }
 *               isActive: { type: "boolean" }
 *     responses:
 *       200:
 *         description: Updated role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     role: { $ref: '#/components/schemas/Role' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/:id", authorize("roles", "update"), RoleController.updateRole);

/**
 * @openapi
 * /api/v1/roles/{id}:
 *   delete:
 *     tags: [Roles]
 *     summary: Delete a role
 *     description: Requires `roles:delete`. Fails if users still hold the role.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200: { description: Role deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Role still assigned to users }
 */
router.delete("/:id", authorize("roles", "delete"), RoleController.deleteRole);

export default router;
