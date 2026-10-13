import mongoose from "mongoose";
import Department from "./department.model";
import Student from "../student/student.model";
import Course from "../course/course.model";
import { ApiError } from "../../lib/ApiError";
import type {
  CreateDepartmentBody,
  UpdateDepartmentBody,
  ListDepartmentsQuery,
} from "./department.validation";

// ─── Lean document shape ──────────────────────────────────────────────────────

interface LeanDepartment {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** Safe department payload. */
function toResponse(doc: LeanDepartment) {
  return {
    id: doc._id.toString(),
    name: doc.name,
    code: doc.code,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ─── createDepartment ─────────────────────────────────────────────────────────

export async function createDepartment(input: CreateDepartmentBody) {
  const taken = await Department.exists({ code: input.code });
  if (taken) {
    throw new ApiError(
      409,
      "CODE_IN_USE",
      "A department with this code already exists"
    );
  }

  const doc = await Department.create({
    name: input.name,
    code: input.code,
    isActive: true,
  });

  return toResponse(doc.toObject() as LeanDepartment);
}

// ─── listDepartments ──────────────────────────────────────────────────────────

export async function listDepartments(query: ListDepartmentsQuery) {
  const { page, limit, search, isActive } = query;

  const filter: Record<string, unknown> = {};
  if (isActive !== undefined) filter.isActive = isActive;
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { name: { $regex: safe, $options: "i" } },
      { code: { $regex: safe, $options: "i" } },
    ];
  }

  const [total, docs] = await Promise.all([
    Department.countDocuments(filter),
    Department.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as LeanDepartment[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── getDepartmentById ────────────────────────────────────────────────────────

export async function getDepartmentById(id: string) {
  const doc = await Department.findById(id).lean();
  if (!doc) {
    throw new ApiError(404, "DEPARTMENT_NOT_FOUND", "Department not found");
  }
  return toResponse(doc as unknown as LeanDepartment);
}

// ─── updateDepartment ─────────────────────────────────────────────────────────

export async function updateDepartment(id: string, input: UpdateDepartmentBody) {
  const set: Record<string, unknown> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.isActive !== undefined) set.isActive = input.isActive;

  // Deactivation is a flag flip only — linked students and courses keep their
  // history; new associations are rejected by the student/course services.
  const doc = await Department.findByIdAndUpdate(
    id,
    { $set: set },
    { new: true, runValidators: true }
  ).lean();

  if (!doc) {
    throw new ApiError(404, "DEPARTMENT_NOT_FOUND", "Department not found");
  }

  return toResponse(doc as unknown as LeanDepartment);
}

// ─── deleteDepartment ─────────────────────────────────────────────────────────

export async function deleteDepartment(id: string): Promise<void> {
  // A department may only be physically removed when nothing references it.
  // Otherwise the caller should deactivate it, which preserves history.
  const [studentCount, courseCount] = await Promise.all([
    Student.countDocuments({ departmentId: id }),
    Course.countDocuments({ departmentId: id }),
  ]);

  if (studentCount > 0 || courseCount > 0) {
    throw new ApiError(
      409,
      "DEPARTMENT_IN_USE",
      `Department is referenced by ${studentCount} student(s) and ${courseCount} course(s). Deactivate it instead.`
    );
  }

  const deleted = await Department.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "DEPARTMENT_NOT_FOUND", "Department not found");
  }
}
