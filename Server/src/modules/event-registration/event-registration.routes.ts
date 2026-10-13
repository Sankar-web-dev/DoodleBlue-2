import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as RegistrationController from "./event-registration.controller";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("eventRegistrations", "create"),
  RegistrationController.register
);
router.get(
  "/",
  authorize("eventRegistrations", "read"),
  RegistrationController.listRegistrations
);
router.get(
  "/:id",
  authorize("eventRegistrations", "read"),
  RegistrationController.getRegistration
);
router.patch(
  "/:id",
  authorize("eventRegistrations", "update"),
  RegistrationController.reviewRegistration
);
// Cancelling your own registration only needs read access — ownership is
// enforced in the service.
router.post(
  "/:id/cancel",
  authorize("eventRegistrations", "read"),
  RegistrationController.cancelRegistration
);
router.delete(
  "/:id",
  authorize("eventRegistrations", "delete"),
  RegistrationController.deleteRegistration
);

export default router;
