import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as UsersController from "./users.controller";

// User-account provisioning — SUPER_ADMIN (or any role granted users:*).
const router = Router();

router.use(authenticate);

router.post("/", authorize("users", "create"), UsersController.createUser);
router.get("/", authorize("users", "read"), UsersController.listUsers);

export default router;
