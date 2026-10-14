import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as MembershipController from "./club-membership.controller";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("clubMemberships", "create"),
  MembershipController.createMembership
);
router.get(
  "/",
  authorize("clubMemberships", "read"),
  MembershipController.listMemberships
);
// Self-scoped read — no resource permission needed; the caller only ever
// sees their own memberships. Must precede /:id.
router.get("/me", MembershipController.listMyMemberships);
router.get(
  "/:id",
  authorize("clubMemberships", "read"),
  MembershipController.getMembership
);
router.patch(
  "/:id/approve",
  authorize("clubMemberships", "update"),
  MembershipController.approveMembership
);
router.patch(
  "/:id",
  authorize("clubMemberships", "update"),
  MembershipController.updateMembership
);
router.delete(
  "/:id",
  authorize("clubMemberships", "delete"),
  MembershipController.deleteMembership
);

export default router;
