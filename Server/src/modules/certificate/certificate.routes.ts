import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as CertificateController from "./certificate.controller";

const router = Router();

router.use(authenticate);

router.post(
  "/",
  authorize("certificates", "create"),
  CertificateController.requestCertificate
);
router.get(
  "/",
  authorize("certificates", "read"),
  CertificateController.listCertificates
);
router.get(
  "/:id",
  authorize("certificates", "read"),
  CertificateController.getCertificate
);
router.patch(
  "/:id",
  authorize("certificates", "update"),
  CertificateController.updateCertificate
);
router.delete(
  "/:id",
  authorize("certificates", "delete"),
  CertificateController.deleteCertificate
);

export default router;
