import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as DepartmentController from "./department.controller";

// Department management — requires the "departments" resource permission.
const router = Router();

router.use(authenticate);

router.post("/", authorize("departments", "create"), DepartmentController.createDepartment);
router.get("/", authorize("departments", "read"), DepartmentController.listDepartments);
router.get("/:id", authorize("departments", "read"), DepartmentController.getDepartment);
router.patch("/:id", authorize("departments", "update"), DepartmentController.updateDepartment);
router.delete("/:id", authorize("departments", "delete"), DepartmentController.deleteDepartment);

export default router;
