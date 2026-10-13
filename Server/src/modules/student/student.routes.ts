import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as StudentController from "./student.controller";

// Student management — requires the "students" resource permission.
const router = Router();

router.use(authenticate);

router.post("/", authorize("students", "create"), StudentController.createStudent);
router.get("/", authorize("students", "read"), StudentController.listStudents);
router.get("/:id", authorize("students", "read"), StudentController.getStudent);
router.patch("/:id/status", authorize("students", "update"), StudentController.updateStudentStatus);
router.patch("/:id", authorize("students", "update"), StudentController.updateStudent);

export default router;
