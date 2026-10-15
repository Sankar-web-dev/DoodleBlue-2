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

router.post("/", authorize("users", "create"), UsersController.createUser);
router.post(
  "/upload-avatar",
  authorize("users", "create"),
  uploadProfileImage.single("avatar"),
  UsersController.uploadAvatar
);
router.get("/", authorize("users", "read"), UsersController.listUsers);
// Picker list — the controller applies its own multi-permission check.
// Must precede /:id.
router.get("/options", UsersController.listUserOptions);
router.get("/:id", authorize("users", "read"), UsersController.getUser);
router.patch("/:id", authorize("users", "update"), UsersController.updateUser);
router.delete("/:id", authorize("users", "delete"), UsersController.deleteUser);

export default router;
