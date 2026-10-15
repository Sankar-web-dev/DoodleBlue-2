import { Router } from "express";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from "../auth/auth.middleware";
import { uploadEventImage } from "../../lib/upload";
import * as EventController from "./event.controller";

const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);

// Collection
/**
 * @openapi
 * /api/v1/events:
 *   post:
 *     tags: [Events]
 *     summary: Create an event
 *     description: >-
 *       Requires `events:create`. `CLUB` events require `clubId` and are
 *       visible only to that club's ACTIVE members; `GENERAL` events must
 *       not have one and are visible to all. Events are only browsable by
 *       students once `PUBLISHED`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, eventType, venue, startAt, endAt]
 *             properties:
 *               title: { type: string, minLength: 2, maxLength: 120 }
 *               description: { type: string, maxLength: 1000 }
 *               eventType: { type: string, enum: [GENERAL, CLUB] }
 *               clubId: { type: string, description: "Required for CLUB events" }
 *               venue: { type: string, minLength: 1, maxLength: 200 }
 *               startAt: { type: string, format: date-time }
 *               endAt: { type: string, format: date-time }
 *               registrationDeadline: { type: string, format: date-time }
 *               capacity: { type: integer, minimum: 1 }
 *               imageUrl: { type: string }
 *     responses:
 *       201:
 *         description: Event created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     event: { $ref: '#/components/schemas/Event' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post("/", authorize("events", "create"), EventController.createEvent);

/**
 * @openapi
 * /api/v1/events/upload-image:
 *   post:
 *     tags: [Events]
 *     summary: Upload an event image
 *     description: >-
 *       Requires `events:create`. Multipart upload — returns a relative
 *       path (`/uploads/events/…`) to pass as `imageUrl`.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Uploaded file path
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     path: { type: string, example: "/uploads/events/event-1.jpg" }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.post(
  "/upload-image",
  authorize("events", "create"),
  uploadEventImage.single("image"),
  EventController.uploadEventImage
);

/**
 * @openapi
 * /api/v1/events:
 *   get:
 *     tags: [Events]
 *     summary: List events
 *     description: >-
 *       Requires `events:read`. Visibility is scoped by role — students see
 *       only PUBLISHED events (GENERAL + CLUB events of clubs where they are
 *       ACTIVE members).
 *     parameters:
 *       - { $ref: '#/components/parameters/PageQuery' }
 *       - { $ref: '#/components/parameters/LimitQuery' }
 *       - { in: query, name: eventType, schema: { type: string, enum: [GENERAL, CLUB] } }
 *       - { in: query, name: clubId, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [DRAFT, PENDING, APPROVED, REJECTED, PUBLISHED, CANCELLED] } }
 *       - { in: query, name: search, schema: { type: string } }
 *     responses:
 *       200:
 *         description: Paginated events
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
 *                       items: { $ref: '#/components/schemas/Event' }
 *                     meta: { $ref: '#/components/schemas/Meta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get("/", authorize("events", "read"), EventController.listEvents);

// Single event
/**
 * @openapi
 * /api/v1/events/{id}:
 *   get:
 *     tags: [Events]
 *     summary: Get an event
 *     description: Requires `events:read` (same visibility scoping as list).
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200:
 *         description: The event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     event: { $ref: '#/components/schemas/Event' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:id", authorize("events", "read"), EventController.getEvent);

/**
 * @openapi
 * /api/v1/events/{id}:
 *   patch:
 *     tags: [Events]
 *     summary: Update an event
 *     description: >-
 *       Requires `events:update`. `clubId`/`registrationDeadline`/`capacity`/
 *       `imageUrl` accept `null` to clear.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string, minLength: 2, maxLength: 120 }
 *               description: { type: string, maxLength: 1000 }
 *               eventType: { type: string, enum: [GENERAL, CLUB] }
 *               clubId: { type: string, nullable: true }
 *               venue: { type: string, minLength: 1, maxLength: 200 }
 *               startAt: { type: string, format: date-time }
 *               endAt: { type: string, format: date-time }
 *               registrationDeadline: { type: string, format: date-time, nullable: true }
 *               capacity: { type: integer, minimum: 1, nullable: true }
 *               imageUrl: { type: string, nullable: true }
 *     responses:
 *       200:
 *         description: Updated event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     event: { $ref: '#/components/schemas/Event' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/:id", authorize("events", "update"), EventController.updateEvent);

/**
 * @openapi
 * /api/v1/events/{id}:
 *   delete:
 *     tags: [Events]
 *     summary: Delete an event
 *     description: Requires `events:delete`.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200: { description: Event deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:id", authorize("events", "delete"), EventController.deleteEvent);

// Status transitions
/**
 * @openapi
 * /api/v1/events/{id}/submit:
 *   post:
 *     tags: [Events]
 *     summary: Submit for approval
 *     description: DRAFT → PENDING. Requires `events:update` (creator/faculty).
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200:
 *         description: Event submitted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     event: { $ref: '#/components/schemas/Event' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Invalid status transition }
 */
router.post(
  "/:id/submit",
  authorize("events", "update"),
  EventController.submitEvent
);

/**
 * @openapi
 * /api/v1/events/{id}/approve:
 *   post:
 *     tags: [Events]
 *     summary: Approve an event
 *     description: SUPER_ADMIN only — PENDING → APPROVED.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200:
 *         description: Event approved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     event: { $ref: '#/components/schemas/Event' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Invalid status transition }
 */
router.post(
  "/:id/approve",
  authorize("events", "update"),
  EventController.approveEvent
);

/**
 * @openapi
 * /api/v1/events/{id}/reject:
 *   post:
 *     tags: [Events]
 *     summary: Reject an event
 *     description: SUPER_ADMIN only — PENDING → REJECTED (reason required).
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rejectionReason]
 *             properties:
 *               rejectionReason: { type: string, minLength: 1, maxLength: 500 }
 *     responses:
 *       200:
 *         description: Event rejected
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     event: { $ref: '#/components/schemas/Event' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Invalid status transition }
 */
router.post(
  "/:id/reject",
  authorize("events", "update"),
  EventController.rejectEvent
);

/**
 * @openapi
 * /api/v1/events/{id}/publish:
 *   post:
 *     tags: [Events]
 *     summary: Publish an event
 *     description: >-
 *       SUPER_ADMIN only — APPROVED → PUBLISHED. Only published events are
 *       visible to students for browsing and registration.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200:
 *         description: Event published
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     event: { $ref: '#/components/schemas/Event' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Invalid status transition }
 */
router.post(
  "/:id/publish",
  authorize("events", "update"),
  EventController.publishEvent
);

/**
 * @openapi
 * /api/v1/events/{id}/cancel:
 *   post:
 *     tags: [Events]
 *     summary: Cancel an event
 *     description: → CANCELLED. Requires `events:update`.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200:
 *         description: Event cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     event: { $ref: '#/components/schemas/Event' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Invalid status transition }
 */
router.post(
  "/:id/cancel",
  authorize("events", "update"),
  EventController.cancelEvent
);

export default router;
