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
router.get(
  "/:id",
  authorize("clubMemberships", "read"),
  MembershipController.getMembership
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
