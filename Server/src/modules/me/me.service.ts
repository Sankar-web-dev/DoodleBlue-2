import mongoose from "mongoose";
import Student from "../student/student.model";
import Enrollment from "../enrollment/enrollment.model";
import Attendance from "../attendance/attendance.model";
import { ApiError } from "../../lib/ApiError";
import type { IUser } from "../auth/user.model";
import type {
  MyEnrollmentsQuery,
  MyAttendanceQuery,
} from "./me.validation";

// ─── Lean document shapes ─────────────────────────────────────────────────────

interface DepartmentRef {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
}

interface CourseRef {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  isActive: boolean;
  departmentId?: DepartmentRef;
}

interface MyStudentDoc {
  _id: mongoose.Types.ObjectId;
  studentNumber: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentId: DepartmentRef;
  admissionDate?: Date;
  status: string;
  createdAt: Date;
}

interface MyEnrollmentDoc {
  _id: mongoose.Types.ObjectId;
  courseId: CourseRef;
  enrolledAt: Date;
  status: string;
}

interface MyAttendanceDoc {
  _id: mongoose.Types.ObjectId;
  courseId: CourseRef;
  sessionDate: Date;
  status: string;
  note?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve the Student document linked to the authenticated user.
 * Throws 404 when a STUDENT-role account has no linked student profile —
 * that is a data-integrity problem, not a client error.
 */
async function requireOwnStudent(user: IUser) {
  const student = await Student.findById(user.studentId)
    .populate("departmentId", "name code")
    .lean();

  if (!student) {
    throw new ApiError(
      404,
      "STUDENT_NOT_FOUND",
      "No student profile is linked to this account"
    );
  }

  return student as unknown as MyStudentDoc;
}

function toUtcMidnight(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

// ─── getMyProfile ─────────────────────────────────────────────────────────────

export async function getMyProfile(user: IUser) {
  const student = await requireOwnStudent(user);

  return {
    id: student._id.toString(),
    studentNumber: student.studentNumber,
    fullName: student.fullName,
    email: student.email,
    phone: student.phone,
    department: {
      id: student.departmentId._id.toString(),
      name: student.departmentId.name,
      code: student.departmentId.code,
    },
    admissionDate: student.admissionDate,
    status: student.status,
    createdAt: student.createdAt,
  };
}

// ─── getMyEnrollments ─────────────────────────────────────────────────────────

export async function getMyEnrollments(
  user: IUser,
  query: MyEnrollmentsQuery
) {
  const student = await requireOwnStudent(user);
  const { page, limit, status } = query;

  const filter: Record<string, unknown> = { studentId: student._id };
  if (status) filter.status = status;

  const [total, docs] = await Promise.all([
    Enrollment.countDocuments(filter),
    Enrollment.find(filter)
      .populate({
        path: "courseId",
        select: "name code isActive",
        populate: { path: "departmentId", select: "name code" },
      })
      .sort({ enrolledAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const data = (docs as unknown as MyEnrollmentDoc[]).map((doc) => ({
    id: doc._id.toString(),
    enrolledAt: doc.enrolledAt,
    status: doc.status,
    course: doc.courseId
      ? {
          id: doc.courseId._id.toString(),
          name: doc.courseId.name,
          code: doc.courseId.code,
          isActive: doc.courseId.isActive,
          department: doc.courseId.departmentId
            ? {
                id: doc.courseId.departmentId._id.toString(),
                name: doc.courseId.departmentId.name,
                code: doc.courseId.departmentId.code,
              }
            : undefined,
        }
      : undefined,
  }));

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── getMyAttendance ──────────────────────────────────────────────────────────

export async function getMyAttendance(user: IUser, query: MyAttendanceQuery) {
  const student = await requireOwnStudent(user);
  const { page, limit, courseId, status, from, to } = query;

  const filter: Record<string, unknown> = { studentId: student._id };
  if (courseId) filter.courseId = courseId;
  if (status) filter.status = status;

  if (from || to) {
    const range: { $gte?: Date; $lte?: Date } = {};
    if (from) range.$gte = toUtcMidnight(from);
    if (to) {
      const end = toUtcMidnight(to);
      end.setUTCDate(end.getUTCDate() + 1);
      range.$lte = end;
    }
    filter.sessionDate = range;
  }

  const [total, docs] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.find(filter)
      .populate("courseId", "name code")
      .sort({ sessionDate: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  const data = (docs as unknown as MyAttendanceDoc[]).map((doc) => ({
    id: doc._id.toString(),
    sessionDate: doc.sessionDate,
    status: doc.status,
    note: doc.note,
    course: doc.courseId
      ? {
          id: doc.courseId._id.toString(),
          name: doc.courseId.name,
          code: doc.courseId.code,
        }
      : undefined,
  }));

  return {
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
