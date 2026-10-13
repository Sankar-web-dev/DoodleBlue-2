import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as EnrollmentController from "./enrollment.controller";

// Enrollment management — requires the "enrollments" resource permission.
const router = Router();

router.use(authenticate);

router.post("/", authorize("enrollments", "create"), EnrollmentController.enrollStudent);
router.get("/", authorize("enrollments", "read"), EnrollmentController.listEnrollments);
router.get("/:id", authorize("enrollments", "read"), EnrollmentController.getEnrollment);
router.patch("/:id", authorize("enrollments", "update"), EnrollmentController.updateEnrollment);
router.delete("/:id", authorize("enrollments", "delete"), EnrollmentController.deleteEnrollment);

export default router;
