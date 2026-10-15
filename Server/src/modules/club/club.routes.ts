import { Router } from "express";
import {
  authenticate,
  authorize,
  requirePasswordChanged,
} from "../auth/auth.middleware";
import { uploadClubImage } from "../../lib/upload";
import * as ClubController from "./club.controller";

const router = Router();

router.use(authenticate);
router.use(requirePasswordChanged);

router.post("/", authorize("clubs", "create"), ClubController.createClub);
router.post(
  "/upload-image",
  authorize("clubs", "create"),
  uploadClubImage.single("image"),
  ClubController.uploadClubImage
);
router.get("/", authorize("clubs", "read"), ClubController.listClubs);
router.get("/:id", authorize("clubs", "read"), ClubController.getClub);
router.patch(
  "/:id/approve",
  authorize("clubs", "update"),
  ClubController.approveClub
);
router.patch("/:id", authorize("clubs", "update"), ClubController.updateClub);
router.delete("/:id", authorize("clubs", "delete"), ClubController.deleteClub);

export default router;
