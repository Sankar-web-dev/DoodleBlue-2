import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  createCourseSchema,
  updateCourseSchema,
  listCoursesQuerySchema,
  courseIdParamSchema,
} from "./course.validation";
import * as CourseService from "./course.service";

function sendValidationError(res: Response, error: ZodError): void {
  res.status(400).json({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
      details: error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      })),
    },
  });
}

/** Returns the validated :id param or sends a 400 and returns null. */
function parseId(req: Request, res: Response): string | null {
  const parsed = courseIdParamSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: { code: "INVALID_ID", message: "Invalid course id" },
    });
    return null;
  }
  return parsed.data.id;
}

// POST /api/v1/courses
export async function createCourse(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = createCourseSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const course = await CourseService.createCourse(parsed.data);
  res.status(201).json({ success: true, data: { course } });
}

// GET /api/v1/courses
export async function listCourses(
  req: Request,
  res: Response
): Promise<void> {
  const parsed = listCoursesQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const result = await CourseService.listCourses(parsed.data);
  res.status(200).json({
    success: true,
    data: result.data,
    meta: result.meta,
  });
}

// GET /api/v1/courses/:id
export async function getCourse(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const course = await CourseService.getCourseById(id);
  res.status(200).json({ success: true, data: { course } });
}

// PATCH /api/v1/courses/:id
export async function updateCourse(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  const parsed = updateCourseSchema.safeParse(req.body);
  if (!parsed.success) {
    sendValidationError(res, parsed.error);
    return;
  }

  const course = await CourseService.updateCourse(id, parsed.data);
  res.status(200).json({ success: true, data: { course } });
}

// DELETE /api/v1/courses/:id
export async function deleteCourse(
  req: Request,
  res: Response
): Promise<void> {
  const id = parseId(req, res);
  if (!id) return;

  await CourseService.deleteCourse(id);
  res
    .status(200)
    .json({ success: true, data: { message: "Course deleted" } });
}
