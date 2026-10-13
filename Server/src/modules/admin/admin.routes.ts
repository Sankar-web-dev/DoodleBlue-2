import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as AdminController from "./admin.controller";

// Admin-account management — requires the "admins" resource permission.
// SUPER_ADMIN always passes; custom roles can be granted this if needed.
const router = Router();

router.use(authenticate);

router.post("/", authorize("admins", "create"), AdminController.createAdmin);
router.get("/", authorize("admins", "read"), AdminController.listAdmins);
router.get("/:id", authorize("admins", "read"), AdminController.getAdmin);
router.patch("/:id", authorize("admins", "update"), AdminController.updateAdmin);

export default router;
