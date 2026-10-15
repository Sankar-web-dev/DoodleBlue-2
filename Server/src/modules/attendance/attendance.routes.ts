import { Router } from "express";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from "../auth/auth.middleware";
import * as AttendanceController from "./attendance.controller";

const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);

/**
 * @openapi
 * /api/v1/attendance:
 *   post:
 *     tags: [Attendance]
 *     summary: Mark attendance
 *     description: >-
 *       Requires `attendance:create`. Markers: GENERAL events → EVENT
 *       COORDINATOR role (or super admin); CLUB events → the club's ACTIVE
 *       student coordinator or faculty coordinator. The student must hold a
 *       confirmed registration (`REGISTERED`/`APPROVED`) for the event.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, studentId, status]
 *             properties:
 *               eventId: { type: string }
 *               studentId: { type: string }
 *               status: { type: string, enum: [PRESENT, ABSENT] }
 *     responses:
 *       201:
 *         description: Attendance recorded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendance: { $ref: '#/components/schemas/AttendanceRecord' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403:
 *         description: Not an authorized marker for this event
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       404: { description: Event or student not found / not confirmed }
 *       409: { description: Attendance already recorded }
 */
router.post(
  "/",
  authorize("attendance", "create"),
  AttendanceController.markAttendance
);

/**
 * @openapi
 * /api/v1/attendance:
 *   get:
 *     tags: [Attendance]
 *     summary: List attendance records
 *     description: >-
 *       Requires `attendance:read`. Managers (create/update permission) see
 *       records for the events they own — event coordinators for GENERAL,
 *       club staff for their club events, super admin for all — plus their
 *       own records. Plain members see only their own.
 *     parameters:
 *       - { $ref: '#/components/parameters/PageQuery' }
 *       - { $ref: '#/components/parameters/LimitQuery' }
 *       - { in: query, name: eventId, schema: { type: string } }
 *       - { in: query, name: studentId, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [PRESENT, ABSENT] } }
 *     responses:
 *       200:
 *         description: Paginated attendance records
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/AttendanceRecord' }
 *                     meta: { $ref: '#/components/schemas/Meta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/",
  authorize("attendance", "read"),
  AttendanceController.listAttendance
);

/**
 * @openapi
 * /api/v1/attendance/{id}:
 *   patch:
 *     tags: [Attendance]
 *     summary: Correct an attendance record
 *     description: >-
 *       Requires `attendance:update`. Same event-ownership rules as marking:
 *       event coordinator for GENERAL events, club coordinator/faculty for
 *       CLUB events, super admin for all.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [PRESENT, ABSENT] }
 *     responses:
 *       200:
 *         description: Updated record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     attendance: { $ref: '#/components/schemas/AttendanceRecord' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch(
  "/:id",
  authorize("attendance", "update"),
  AttendanceController.updateAttendance
);

/**
 * @openapi
 * /api/v1/attendance/{id}:
 *   delete:
 *     tags: [Attendance]
 *     summary: Delete an attendance record
 *     description: Requires `attendance:delete`.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200: { description: Record deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete(
  "/:id",
  authorize("attendance", "delete"),
  AttendanceController.deleteAttendance
);

export default router;
