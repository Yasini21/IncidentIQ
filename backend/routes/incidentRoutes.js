import express from "express";
const router = express.Router();

import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  deleteIncident,
  getAnalytics,
} from "../controllers/incidentController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

// 🔹 Create incident → ADMIN only
router.post("/", verifyToken, allowRoles("admin","viewer"), createIncident);

// 🔹 View all → ALL roles
router.get(
  "/",
  verifyToken,
  allowRoles("admin", "engineer", "viewer"),
  getIncidents
);

// 🔹 View one → ALL roles
router.get(
  "/:id",
  verifyToken,
  allowRoles("admin", "engineer", "viewer"),
  getIncidentById
);
router.get("/analytics", verifyToken, getAnalytics);

// 🔹 Update status → ENGINEER + ADMIN
router.patch(
  "/:id",
  verifyToken,
  allowRoles("admin", "engineer"),
  updateIncidentStatus
);

// 🔹 Delete → ADMIN only
router.delete(
  "/:id",
  verifyToken,
  allowRoles("admin"),
  deleteIncident
);

export default router;