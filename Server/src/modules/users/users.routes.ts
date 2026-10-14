import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as UsersController from "./users.controller";

// User-account provisioning — SUPER_ADMIN (or any role granted users:*).
const router = Router();

router.use(authenticate);

router.post("/", authorize("users", "create"), UsersController.createUser);
router.get("/", authorize("users", "read"), UsersController.listUsers);
// Picker list — the controller applies its own multi-permission check.
// Must precede /:id.
router.get("/options", UsersController.listUserOptions);
router.get("/:id", authorize("users", "read"), UsersController.getUser);
router.patch("/:id", authorize("users", "update"), UsersController.updateUser);
router.delete("/:id", authorize("users", "delete"), UsersController.deleteUser);

export default router;
