import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as RoleController from "./role.controller";

// Role management — SUPER_ADMIN only (they own the permission schema).
// Custom-role holders cannot modify the role definitions themselves.
const router = Router();

router.use(authenticate);

router.post("/", authorize("roles", "create"), RoleController.createRole);
router.get("/", authorize("roles", "read"), RoleController.listRoles);
router.get("/:id", authorize("roles", "read"), RoleController.getRole);
router.patch("/:id", authorize("roles", "update"), RoleController.updateRole);
router.delete("/:id", authorize("roles", "delete"), RoleController.deleteRole);

export default router;
