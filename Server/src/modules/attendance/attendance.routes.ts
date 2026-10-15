import { Router } from "express";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from "../auth/auth.middleware";
import * as AttendanceController from "./attendance.controller";

const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);

router.post(
  "/",
  authorize("attendance", "create"),
  AttendanceController.markAttendance
);
router.get(
  "/",
  authorize("attendance", "read"),
  AttendanceController.listAttendance
);
router.patch(
  "/:id",
  authorize("attendance", "update"),
  AttendanceController.updateAttendance
);
router.delete(
  "/:id",
  authorize("attendance", "delete"),
  AttendanceController.deleteAttendance
);

export default router;
