import { Request, Response } from "express";
import * as AnalyticsService from "./analytics.service";

// GET /api/v1/analytics/summary
export async function getSummary(
  _req: Request,
  res: Response
): Promise<void> {
  const summary = await AnalyticsService.getSummary();
  res.status(200).json({ success: true, data: summary });
}
