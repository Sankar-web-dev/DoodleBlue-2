import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as CourseController from "./course.controller";

// Course management — requires the "courses" resource permission.
const router = Router();

router.use(authenticate);

router.post("/", authorize("courses", "create"), CourseController.createCourse);
router.get("/", authorize("courses", "read"), CourseController.listCourses);
router.get("/:id", authorize("courses", "read"), CourseController.getCourse);
router.patch("/:id", authorize("courses", "update"), CourseController.updateCourse);
router.delete("/:id", authorize("courses", "delete"), CourseController.deleteCourse);

export default router;
