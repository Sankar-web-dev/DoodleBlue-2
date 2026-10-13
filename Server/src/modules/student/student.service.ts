import mongoose from "mongoose";
import bcrypt from "bcrypt";
import User from "../auth/user.model";
import Student from "./student.model";
import Department from "../department/department.model";
import Role from "../role/role.model";
import { ApiError } from "../../lib/ApiError";
import type {
  CreateStudentBody,
  UpdateStudentBody,
  UpdateStudentStatusBody,
  ListStudentsQuery,
} from "./student.validation";

const BCRYPT_ROUNDS = 12;

// ─── Populated document shapes returned by .lean() ────────────────────────────

interface DepartmentRef {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
}

interface UserRef {
  _id: mongoose.Types.ObjectId;
  name: string;
  mustChangePassword: boolean;
  isActive: boolean;
}

interface PopulatedStudent {
  _id: mongoose.Types.ObjectId;
  studentNumber: string;
  fullName: string;
  email: string;
  phone?: string;
  departmentId: DepartmentRef;
  userId: UserRef;
  admissionDate?: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Safe student payload — never includes passwordHash or session data. */
function toStudentResponse(doc: PopulatedStudent) {
  return {
    id: doc._id.toString(),
    studentNumber: doc.studentNumber,
    fullName: doc.fullName,
    email: doc.email,
    phone: doc.phone,
    department: {
      id: doc.departmentId._id.toString(),
      name: doc.departmentId.name,
      code: doc.departmentId.code,
    },
    admissionDate: doc.admissionDate,
    status: doc.status,
    user: {
      id: doc.userId._id.toString(),
      name: doc.userId.name,
      mustChangePassword: doc.userId.mustChangePassword,
      isActive: doc.userId.isActive,
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function inTransaction<T>(
  fn: (session: mongoose.ClientSession) => Promise<T>
): Promise<T> {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

async function assertActiveDepartment(departmentId: string): Promise<void> {
  const department = await Department.findById(departmentId).select("isActive");

  if (!department) {
    throw new ApiError(400, "DEPARTMENT_NOT_FOUND", "Department not found");
  }
  if (!department.isActive) {
    throw new ApiError(
      400,
      "DEPARTMENT_INACTIVE",
      "Department is not active"
    );
  }
}

async function fetchPopulated(id: string | mongoose.Types.ObjectId) {
  const doc = await Student.findById(id)
    .populate("departmentId", "name code")
    .populate("userId", "name mustChangePassword isActive")
    .lean();

  if (!doc) {
    throw new ApiError(404, "STUDENT_NOT_FOUND", "Student not found");
  }

  return toStudentResponse(doc as unknown as PopulatedStudent);
}

// ─── createStudent ────────────────────────────────────────────────────────────

export async function createStudent(input: CreateStudentBody) {
  await assertActiveDepartment(input.departmentId);

  const [emailTaken, numberTaken, studentRole] = await Promise.all([
    User.exists({ email: input.email }),
    Student.exists({ studentNumber: input.studentNumber }),
    Role.findOne({ name: "STUDENT", isSystem: true }),
  ]);

  if (emailTaken) {
    throw new ApiError(
      409,
      "EMAIL_IN_USE",
      "A user with this email already exists"
    );
  }
  if (numberTaken) {
    throw new ApiError(
      409,
      "STUDENT_NUMBER_IN_USE",
      "A student with this student number already exists"
    );
  }
  if (!studentRole) {
    throw new ApiError(
      500,
      "STUDENT_ROLE_MISSING",
      "System STUDENT role is missing — run the seed script"
    );
  }

  const passwordHash = await bcrypt.hash(
    input.temporaryPassword,
    BCRYPT_ROUNDS
  );

  // User + Student must be created atomically — a failure after User.create
  // must not leave an orphan account without a student profile.
  const studentId = await inTransaction(async (session) => {
    const [user] = await User.create(
      [
        {
          name: input.fullName,
          email: input.email,
          passwordHash,
          role: studentRole.name,
          roleId: studentRole._id,
          mustChangePassword: false,
          isActive: true,
        },
      ],
      { session }
    );

    const [student] = await Student.create(
      [
        {
          userId: user._id,
          studentNumber: input.studentNumber,
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          departmentId: input.departmentId,
          admissionDate: input.admissionDate,
          status: "ACTIVE",
        },
      ],
      { session }
    );

    user.studentId = student._id as mongoose.Types.ObjectId;
    await user.save({ session });

    return student._id as mongoose.Types.ObjectId;
  });

  return fetchPopulated(studentId);
}

// ─── listStudents ─────────────────────────────────────────────────────────────

export async function listStudents(query: ListStudentsQuery) {
  const { page, limit, search, departmentId, status } = query;

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (departmentId) filter.departmentId = departmentId;
  if (search) {
    const safe = escapeRegex(search);
    filter.$or = [
      { fullName: { $regex: safe, $options: "i" } },
      { studentNumber: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ];
  }

  const [total, docs] = await Promise.all([
    Student.countDocuments(filter),
    Student.find(filter)
      .populate("departmentId", "name code")
      .populate("userId", "name mustChangePassword isActive")
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
  ]);

  return {
    data: (docs as unknown as PopulatedStudent[]).map(toStudentResponse),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ─── getStudentById ───────────────────────────────────────────────────────────

export async function getStudentById(id: string) {
  return fetchPopulated(id);
}

// ─── updateStudent ────────────────────────────────────────────────────────────

export async function updateStudent(id: string, input: UpdateStudentBody) {
  const student = await Student.findById(id).select("userId").lean();
  if (!student) {
    throw new ApiError(404, "STUDENT_NOT_FOUND", "Student not found");
  }

  if (input.departmentId) {
    await assertActiveDepartment(input.departmentId);
  }

  const { status, ...profile } = input;
  const set: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(profile)) {
    if (value !== undefined) set[key] = value;
  }
  if (status) set.status = status;

  // When status changes, keep the linked User's isActive flag in sync so a
  // deactivated student can no longer authenticate.
  await inTransaction(async (session) => {
    await Student.findByIdAndUpdate(
      id,
      { $set: set },
      { session, runValidators: true }
    );
    if (status) {
      await User.findByIdAndUpdate(
        student.userId,
        { $set: { isActive: status === "ACTIVE" } },
        { session }
      );
    }
  });

  return fetchPopulated(id);
}

// ─── updateStudentStatus ──────────────────────────────────────────────────────

export async function updateStudentStatus(
  id: string,
  input: UpdateStudentStatusBody
) {
  const student = await Student.findById(id).select("userId").lean();
  if (!student) {
    throw new ApiError(404, "STUDENT_NOT_FOUND", "Student not found");
  }

  // Idempotent: setting the same status twice is a no-op that still returns
  // the current representation. Enrollment and attendance history is never
  // touched — the records are only marked inactive.
  await inTransaction(async (session) => {
    await Student.findByIdAndUpdate(
      id,
      { $set: { status: input.status } },
      { session }
    );
    await User.findByIdAndUpdate(
      student.userId,
      { $set: { isActive: input.status === "ACTIVE" } },
      { session }
    );
  });

  return fetchPopulated(id);
}
