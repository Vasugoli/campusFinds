import { Router } from "express";
import { auth } from "@/middleware/auth.ts";
import { createReport, getReports, reviewReport, getReport } from "../controllers/reports_controllers.ts";

const reportRoutes = Router();

// Create a report
reportRoutes.post("/", auth, createReport);

// Get reports (admin only)
reportRoutes.get("/", auth, getReports);

// Review a report (admin only)
reportRoutes.put("/:id/review", auth, reviewReport);

// Get report details
reportRoutes.get("/:id", auth, getReport);

export default reportRoutes;
