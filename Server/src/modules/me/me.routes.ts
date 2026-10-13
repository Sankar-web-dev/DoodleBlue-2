import { Router } from "express";
import { authenticate, requireStudentAccount } from "../auth/auth.middleware";
import * as MeController from "./me.controller";

// Self-service endpoints — only accounts with a linked student profile
// (studentId field set on the User document) may access these routes.
// Nothing here trusts a client-supplied student id.
const router = Router();

router.use(authenticate, requireStudentAccount);

router.get("/profile", MeController.getMyProfile);
router.get("/enrollments", MeController.getMyEnrollments);
router.get("/attendance", MeController.getMyAttendance);

export default router;
