import { Router } from "express";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from "../auth/auth.middleware";
import * as CertificateController from "./certificate.controller";

const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);

/**
 * @openapi
 * /api/v1/certificates:
 *   post:
 *     tags: [Certificates]
 *     summary: Request a certificate
 *     description: >-
 *       Requires `certificates:create`. Requesters: GENERAL events → EVENT
 *       COORDINATOR role (or super admin); CLUB events → the club's ACTIVE
 *       student coordinator or faculty coordinator. The student must have
 *       been marked `PRESENT` for the event. Starts `PENDING`.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [eventId, studentId]
 *             properties:
 *               eventId: { type: string }
 *               studentId: { type: string }
 *     responses:
 *       201:
 *         description: Certificate requested (PENDING)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     certificate: { $ref: '#/components/schemas/Certificate' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403:
 *         description: Not an authorized requester for this event
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ApiError' }
 *       404: { description: Event or student not found / not marked present }
 *       409: { description: Certificate already exists for this student+event }
 */
router.post(
  "/",
  authorize("certificates", "create"),
  CertificateController.requestCertificate
);

/**
 * @openapi
 * /api/v1/certificates:
 *   get:
 *     tags: [Certificates]
 *     summary: List certificates
 *     description: >-
 *       Requires `certificates:read`. Students see only their own; event
 *       coordinators see GENERAL-event certificates; club staff see their
 *       club events'; super admin sees all.
 *     parameters:
 *       - { $ref: '#/components/parameters/PageQuery' }
 *       - { $ref: '#/components/parameters/LimitQuery' }
 *       - { in: query, name: eventId, schema: { type: string } }
 *       - { in: query, name: studentId, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [PENDING, APPROVED, REJECTED, ISSUED] } }
 *     responses:
 *       200:
 *         description: Paginated certificates
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
 *                       items: { $ref: '#/components/schemas/Certificate' }
 *                     meta: { $ref: '#/components/schemas/Meta' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 */
router.get(
  "/",
  authorize("certificates", "read"),
  CertificateController.listCertificates
);

/**
 * @openapi
 * /api/v1/certificates/{id}:
 *   get:
 *     tags: [Certificates]
 *     summary: Get a certificate
 *     description: Requires `certificates:read` (scoped as list).
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200:
 *         description: The certificate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     certificate: { $ref: '#/components/schemas/Certificate' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  "/:id",
  authorize("certificates", "read"),
  CertificateController.getCertificate
);

/**
 * @openapi
 * /api/v1/certificates/{id}:
 *   patch:
 *     tags: [Certificates]
 *     summary: Approve / reject / issue
 *     description: >-
 *       Requires `certificates:update`. Lifecycle: `PENDING` → `APPROVED`
 *       (or `REJECTED`, with `rejectionReason`) → `ISSUED` (with
 *       `certificateUrl`). Approvers: GENERAL events → event coordinator /
 *       super admin; CLUB events → the club's faculty coordinator or super
 *       admin (student coordinators cannot approve their own club's).
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
 *               status: { type: string, enum: [APPROVED, REJECTED, ISSUED] }
 *               rejectionReason:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 *                 description: Required when status is REJECTED
 *               certificateUrl:
 *                 type: string
 *                 format: uri
 *                 description: Certificate file/link when issuing
 *     responses:
 *       200:
 *         description: Updated certificate
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     certificate: { $ref: '#/components/schemas/Certificate' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { description: Invalid status transition }
 */
router.patch(
  "/:id",
  authorize("certificates", "update"),
  CertificateController.updateCertificate
);

/**
 * @openapi
 * /api/v1/certificates/{id}:
 *   delete:
 *     tags: [Certificates]
 *     summary: Delete a certificate
 *     description: Requires `certificates:delete`.
 *     parameters:
 *       - { $ref: '#/components/parameters/ObjectIdPath' }
 *     responses:
 *       200: { description: Certificate deleted }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete(
  "/:id",
  authorize("certificates", "delete"),
  CertificateController.deleteCertificate
);

export default router;
