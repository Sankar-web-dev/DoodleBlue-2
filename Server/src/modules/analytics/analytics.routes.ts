import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import * as AnalyticsController from "./analytics.controller";

// Analytics — requires the "analytics" read permission.
const router = Router();

router.use(authenticate);

router.get("/summary", authorize("analytics", "read"), AnalyticsController.getSummary);

export default router;
