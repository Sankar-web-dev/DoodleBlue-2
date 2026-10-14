import { Router } from "express";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from "../auth/auth.middleware";
import * as EventController from "./event.controller";

const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);

// Collection
router.post("/", authorize("events", "create"), EventController.createEvent);
router.get("/", authorize("events", "read"), EventController.listEvents);

// Single event
router.get("/:id", authorize("events", "read"), EventController.getEvent);
router.patch("/:id", authorize("events", "update"), EventController.updateEvent);
router.delete("/:id", authorize("events", "delete"), EventController.deleteEvent);

// Status transitions
router.post(
  "/:id/submit",
  authorize("events", "update"),
  EventController.submitEvent
);
router.post(
  "/:id/approve",
  authorize("events", "update"),
  EventController.approveEvent
);
router.post(
  "/:id/reject",
  authorize("events", "update"),
  EventController.rejectEvent
);
router.post(
  "/:id/publish",
  authorize("events", "update"),
  EventController.publishEvent
);
router.post(
  "/:id/cancel",
  authorize("events", "update"),
  EventController.cancelEvent
);

export default router;
