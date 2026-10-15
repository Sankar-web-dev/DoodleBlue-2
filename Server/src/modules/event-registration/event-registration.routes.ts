import { Router } from "express";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from "../auth/auth.middleware";
import * as RegistrationController from "./event-registration.controller";

const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);

/**
 * @openapi
 * /api/v1/event-registrations:
 *   post:
 *     tags: [Event Registrations]
 *     summary: Register for an event
 *     description: >-
 *       Requires `eventRegistrations:create` — the caller registers
 *       themselves for a PUBLISHED event. `GENERAL` events register
 *       immediately (`REGISTERED`); `CLUB` events need ACTIVE club
 *       membership and start `PENDING` coordinator approval.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId]
 *             properties:
 *               eventId: { type: string }
 *     responses:
 *       201:
 *         description: Registration created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     registration: { $ref: '#/components/schemas/EventRegistration' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { description: Event not found / not published / registration closed }
 *       409: { description: Already registered / event at capacity }
 */
router.post(
  "/",
  authorize("eventRegistrations", "create"),
  RegistrationController.register
);

/**
 * @openapi
 * /api/v1/event-registrations:
 *   get:
 *     tags: [Event Registrations]
 *     summary: List registrations
 *     description: >-
 *       Requires `eventRegistrations:read`. Students see only their own;
 *       club coordinators/faculty see rosters for their club events;
 *       event coordinators and super admin see all.
 *     parameters:
 *       - { $ref: '#/components/parameters/PageQuery' }
 *       - { $ref: '#/components/parameters/LimitQuery' }
 *       - { in: query, name: eventId, schema: { type: string } }
 *       - { in: query, name: studentId, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [REGISTERED, PENDING, APPROVED, REJECTED, CANCELLED] } }
 *     responses:
 *       200:
 *         description: Paginated registrations
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
 *                       items: { $ref: '#/components/schemas/EventRegistration' }
 *                     meta: { $ref: '#/components/schemas/Meta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/",
  authorize("eventRegistrations", "read"),
  RegistrationController.listRegistrations
);

/**
 * @openapi
 * /api/v1/event-registrations/{id}:
 *   get:
 *     tags: [Event Registrations]
 *     summary: Get a registration
 *     description: Requires `eventRegistrations:read` (scoped as list).
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200:
 *         description: The registration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     registration: { $ref: '#/components/schemas/EventRegistration' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  "/:id",
  authorize("eventRegistrations", "read"),
  RegistrationController.getRegistration
);

/**
 * @openapi
 * /api/v1/event-registrations/{id}:
 *   patch:
 *     tags: [Event Registrations]
 *     summary: Approve / reject a registration
 *     description: >-
 *       Requires `eventRegistrations:update` — club coordinators/faculty for
 *       their club's events (or super admin). `REJECTED` requires a reason.
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
 *               status: { type: string, enum: [APPROVED, REJECTED] }
 *               rejectionReason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: Required when status is REJECTED
 *     responses:
 *       200:
 *         description: Reviewed registration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     registration: { $ref: '#/components/schemas/EventRegistration' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Registration is not pending }
 */
router.patch(
  "/:id",
  authorize("eventRegistrations", "update"),
  RegistrationController.reviewRegistration
);

// Cancelling your own registration only needs read access — ownership is
// enforced in the service.
/**
 * @openapi
 * /api/v1/event-registrations/{id}/cancel:
 *   post:
 *     tags: [Event Registrations]
 *     summary: Cancel my registration
 *     description: >-
 *       Requires `eventRegistrations:read` — the caller cancels their own
 *       registration (ownership enforced in the service).
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200:
 *         description: Registration cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     registration: { $ref: '#/components/schemas/EventRegistration' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post(
  "/:id/cancel",
  authorize("eventRegistrations", "read"),
  RegistrationController.cancelRegistration
);

/**
 * @openapi
 * /api/v1/event-registrations/{id}:
 *   delete:
 *     tags: [Event Registrations]
 *     summary: Delete a registration
 *     description: Requires `eventRegistrations:delete`.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200: { description: Registration deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete(
  "/:id",
  authorize("eventRegistrations", "delete"),
  RegistrationController.deleteRegistration
);

export default router;
