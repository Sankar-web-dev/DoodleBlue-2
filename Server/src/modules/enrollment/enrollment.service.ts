import mongoose from "mongoose";
import Enrollment from "./enrollment.model";
import Student from "../student/student.model";
import Course from "../course/course.model";
import { ApiError } from "../../lib/ApiError";
import type {
  CreateEnrollmentBody,
  UpdateEnrollmentBody,
  ListEnrollmentsQuery,
} from "./enrollment.validation";

// ─── Populated document shape ─────────────────────────────────────────────────

interface StudentRef {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  studentNumber: string;
}

interface CourseRef {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
}

interface PopulatedEnrollment {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId | StudentRef;
  courseId: mongoose.Types.ObjectId | CourseRef;
  enrolledAt: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Safe enrollment payload with student and course summaries. */
function toResponse(doc: PopulatedEnrollment) {
  const student = doc.studentId as StudentRef | mongoose.Types.ObjectId;
  const course = doc.courseId as CourseRef | mongoose.Types.ObjectId;
  const populatedStudent =
    student instanceof mongoose.Types.ObjectId ? null : student;
  const populatedCourse =
    course instanceof mongoose.Types.ObjectId ? null : course;

  return {
    id: doc._id.toString(),
    student: populatedStudent
      ? {
          id: populatedStudent._id.toString(),
          fullName: populatedStudent.fullName,
          studentNumber: populatedStudent.studentNumber,
        }
      : { id: student.toString() },
    course: populatedCourse
      ? {
          id: populatedCourse._id.toString(),
          name: populatedCourse.name,
          code: populatedCourse.code,
        }
      : { id: course.toString() },
    status: doc.status,
    enrolledAt: doc.enrolledAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

async function fetchPopulated(id: string | mongoose.Types.ObjectId) {
  const doc = await Enrollment.findById(id)
    .populate("studentId", "fullName studentNumber")
    .populate("courseId", "name code")
    .lean();

  if (!doc) {
    throw new ApiError(404, "ENROLLMENT_NOT_FOUND", "Enrollment not found");
  }

  return toResponse(doc as unknown as PopulatedEnrollment);
}

// ─── enrollStudent ────────────────────────────────────────────────────────────

export async function enrollStudent(input: CreateEnrollmentBody) {
  const [student, course] = await Promise.all([
    Student.findById(input.studentId).lean(),
    Course.findById(input.courseId).lean(),
  ]);

  if (!student) {
    throw new ApiError(404, "STUDENT_NOT_FOUND", "Student not found");
  }
  if (student.status !== "ACTIVE") {
    throw new ApiError(
      409,
      "STUDENT_INACTIVE",
      "Only active students can be enrolled"
    );
  }
  if (!course) {
    throw new ApiError(404, "COURSE_NOT_FOUND", "Course not found");
  }
  if (!course.isActive) {
    throw new ApiError(
      409,
      "COURSE_INACTIVE",
      "This course is inactive — activate it before enrolling students"
    );
  }

  // A student may only be mapped to a course inside their own department.
  if (!course.departmentId.equals(student.departmentId)) {
    throw new ApiError(
      409,
      "COURSE_DEPARTMENT_MISMATCH",
      "This course belongs to a different department than the student's"
    );
  }

  const existing = await Enrollment.exists({
    studentId: input.studentId,
    courseId: input.courseId,
  });
  if (existing) {
    throw new ApiError(
      409,
      "ALREADY_ENROLLED",
      "The student is already enrolled in this course"
    );
  }

  const doc = await Enrollment.create({
    studentId: input.studentId,
    courseId: input.courseId,
    enrolledAt: new Date(),
    status: "ACTIVE",
  });

  return fetchPopulated(doc._id);
}

// ─── listEnrollments ──────────────────────────────────────────────────────────

export async function listEnrollments(query: ListEnrollmentsQuery) {
  const { page, limit, studentId, courseId, status } = query;

  const filter: Record<string, unknown> = {};
  if (studentId) filter.studentId = studentId;
  if (courseId) filter.courseId = courseId;
  if (status) filter.status = status;

  const [total, docs] = await Promise.all([
    Enrollment.countDocuments(filter),
    Enrollment.find(filter)
      .populate("studentId", "fullName studentNumber")
      .populate("courseId", "name code")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as PopulatedEnrollment[]).map(toResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── getEnrollmentById ────────────────────────────────────────────────────────

export async function getEnrollmentById(id: string) {
  return fetchPopulated(id);
}

// ─── updateEnrollmentStatus ───────────────────────────────────────────────────

export async function updateEnrollmentStatus(
  id: string,
  input: UpdateEnrollmentBody
) {
  // Marks the enrollment ACTIVE / COMPLETED / WITHDRAWN — the record is
  // never physically touched, so attendance history is preserved.
  const doc = await Enrollment.findByIdAndUpdate(
    id,
    { $set: { status: input.status } },
    { new: true }
  ).lean();

  if (!doc) {
    throw new ApiError(404, "ENROLLMENT_NOT_FOUND", "Enrollment not found");
  }

  return fetchPopulated(id);
}

// ─── deleteEnrollment ─────────────────────────────────────────────────────────

export async function deleteEnrollment(id: string): Promise<void> {
  const deleted = await Enrollment.findByIdAndDelete(id);
  if (!deleted) {
    throw new ApiError(404, "ENROLLMENT_NOT_FOUND", "Enrollment not found");
  }
}
