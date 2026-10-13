import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as AttendanceController from "./attendance.controller";

// Attendance management — requires the "attendance" resource permission.
// Students read their own attendance via /api/v1/me/attendance (requireStudentAccount).
const router = Router();

router.use(authenticate);

router.post("/", authorize("attendance", "create"), AttendanceController.recordAttendance);
router.get("/", authorize("attendance", "read"), AttendanceController.listAttendance);
router.get("/:id", authorize("attendance", "read"), AttendanceController.getAttendance);
router.patch("/:id", authorize("attendance", "update"), AttendanceController.updateAttendance);
router.delete("/:id", authorize("attendance", "delete"), AttendanceController.deleteAttendance);

export default router;
