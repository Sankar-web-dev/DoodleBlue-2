import mongoose from "mongoose";
import Student from "../student/student.model";
import Department from "../department/department.model";
import Course from "../course/course.model";
import User from "../auth/user.model";
import Enrollment from "../enrollment/enrollment.model";

// ─── Populated shape for the recent-enrollments feed ──────────────────────────

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
  status: string;
  enrolledAt: Date;
}

function toRecentResponse(doc: PopulatedEnrollment) {
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
  };
}

// ─── getSummary ───────────────────────────────────────────────────────────────

export async function getSummary() {
  const [
    studentsTotal,
    studentsActive,
    departmentsTotal,
    departmentsActive,
    coursesTotal,
    coursesActive,
    adminsTotal,
    adminsActive,
    enrollmentsTotal,
    enrollmentsActive,
    enrollmentsCompleted,
    enrollmentsWithdrawn,
    recentDocs,
  ] = await Promise.all([
    Student.countDocuments({}),
    Student.countDocuments({ status: "ACTIVE" }),
    Department.countDocuments({}),
    Department.countDocuments({ isActive: true }),
    Course.countDocuments({}),
    Course.countDocuments({ isActive: true }),
    User.countDocuments({ role: "ADMIN" }),
    User.countDocuments({ role: "ADMIN", isActive: true }),
    Enrollment.countDocuments({}),
    Enrollment.countDocuments({ status: "ACTIVE" }),
    Enrollment.countDocuments({ status: "COMPLETED" }),
    Enrollment.countDocuments({ status: "WITHDRAWN" }),
    Enrollment.find()
      .populate("studentId", "fullName studentNumber")
      .populate("courseId", "name code")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  return {
    students: {
      total: studentsTotal,
      active: studentsActive,
      inactive: studentsTotal - studentsActive,
    },
    departments: {
      total: departmentsTotal,
      active: departmentsActive,
      inactive: departmentsTotal - departmentsActive,
    },
    courses: {
      total: coursesTotal,
      active: coursesActive,
      inactive: coursesTotal - coursesActive,
    },
    admins: {
      total: adminsTotal,
      active: adminsActive,
      inactive: adminsTotal - adminsActive,
    },
    enrollments: {
      total: enrollmentsTotal,
      active: enrollmentsActive,
      completed: enrollmentsCompleted,
      withdrawn: enrollmentsWithdrawn,
    },
    recentEnrollments: (
      recentDocs as unknown as PopulatedEnrollment[]
    ).map(toRecentResponse),
  };
}
