import mongoose from "mongoose";
import Course from "./course.model";
import Department from "../department/department.model";
import Enrollment from "../enrollment/enrollment.model";
import { ApiError } from "../../lib/ApiError";
import type {
  CreateCourseBody,
  UpdateCourseBody,
  ListCoursesQuery,
} from "./course.validation";

// ─── Lean document shape ──────────────────────────────────────────────────────

interface LeanDepartmentRef {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
}

interface LeanCourse {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  departmentId: mongoose.Types.ObjectId | LeanDepartmentRef;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Safe course payload with the owning department summarised. */
function toResponse(doc: LeanCourse) {
  // departmentId is populated to { _id, name, code } when read; on create it
  // is a raw ObjectId, so normalise both shapes.
  const ref = doc.departmentId as LeanDepartmentRef | mongoose.Types.ObjectId;
  const populated = ref instanceof mongoose.Types.ObjectId ? null : ref;

  return {
    id: doc._id.toString(),
    name: doc.name,
    code: doc.code,
    description: doc.description,
    department: populated
      ? {
          id: populated._id.toString(),
          name: populated.name,
          code: populated.code,
        }
      : { id: ref.toString() },
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── createCourse ─────────────────────────────────────────────────────────────

export async function createCourse(input: CreateCourseBody) {
  const department = await Department.findById(input.departmentId).lean();
  if (!department) {
    throw new ApiError(404, "DEPARTMENT_NOT_FOUND", "Department not found");
  }
  if (!department.isActive) {
    throw new ApiError(
      409,
      "DEPARTMENT_INACTIVE",
      "This department is inactive — activate it before adding courses"
    );
  }

  const taken = await Course.exists({ code: input.code });
  if (taken) {
    throw new ApiError(
      409,
      "CODE_IN_USE",
      "A course with this code already exists"
    );
  }

  const doc = await Course.create({
    name: input.name,
    code: input.code,
    ...(input.description !== undefined
      ? { description: input.description }
      : {}),
    departmentId: input.departmentId,
    isActive: true,
  });

  const created = await Course.findById(doc._id)
    .populate("departmentId", "name code")
    .lean();

  return toResponse(created as unknown as LeanCourse);
}

// ─── listCourses ──────────────────────────────────────────────────────────────

export async function listCourses(query: ListCoursesQuery) {
  const { page, limit, search, departmentId, isActive } = query;

  const filter: Record<string, unknown> = {};
  if (departmentId) filter.departmentId = departmentId;
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { code: { $regex: safe, $options: "i" } },
    ];
  }

  const [total, docs] = await Promise.all([
    Course.countDocuments(filter),
    Course.find(filter)
      .populate("departmentId", "name code")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as LeanCourse[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── getCourseById ────────────────────────────────────────────────────────────

export async function getCourseById(id: string) {
  const doc = await Course.findById(id)
    .populate("departmentId", "name code")
    .lean();
  if (!doc) {
    throw new ApiError(404, "COURSE_NOT_FOUND", "Course not found");
  }
  return toResponse(doc as unknown as LeanCourse);
}

// ─── updateCourse ─────────────────────────────────────────────────────────────

export async function updateCourse(id: string, input: UpdateCourseBody) {
  const set: Record<string, unknown> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.isActive !== undefined) set.isActive = input.isActive;
  if (input.description !== undefined) {
    set.description = input.description === null ? "" : input.description;
  }

  // Deactivation is a flag flip only — enrollments and attendance keep their
  // history; new enrollments are rejected by the enrollment service.
  const doc = await Course.findByIdAndUpdate(
    id,
    { $set: set },
    { new: true, runValidators: true }
  )
    .populate("departmentId", "name code")
    .lean();

  if (!doc) {
    throw new ApiError(404, "COURSE_NOT_FOUND", "Course not found");
  }

  return toResponse(doc as unknown as LeanCourse);
}

// ─── deleteCourse ─────────────────────────────────────────────────────────────

export async function deleteCourse(id: string): Promise<void> {
  // A course may only be physically removed when nothing references it.
  // Otherwise the caller should deactivate it, which preserves history.
  const enrollmentCount = await Enrollment.countDocuments({ courseId: id });

  if (enrollmentCount > 0) {
    throw new ApiError(
      409,
      "COURSE_IN_USE",
      `Course is referenced by ${enrollmentCount} enrollment(s). Deactivate it instead.`
    );
  }

  const deleted = await Course.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "COURSE_NOT_FOUND", "Course not found");
  }
}
