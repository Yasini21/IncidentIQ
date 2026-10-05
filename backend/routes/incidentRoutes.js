import express from "express";
const router = express.Router();

import {
  createIncident,
  getIncidents,
  getIncidentById,
  updateIncidentStatus,
  assignIncidentTeam,
  deleteIncident,
  getAnalytics,
} from "../controllers/incidentController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

//  Create incident → ADMIN or USER
router.post("/", verifyToken, allowRoles("admin", "user"), createIncident);

//  View all → ALL roles
router.get(
  "/",
  verifyToken,
  allowRoles("admin", "developer", "user"),
  getIncidents
);

router.get("/analytics", verifyToken, allowRoles("admin"), getAnalytics);

//  View one → ALL roles
router.get(
  "/:id",
  verifyToken,
  allowRoles("admin", "developer", "user"),
  getIncidentById
);
//  Update status → DEVELOPER + ADMIN
router.patch(
  "/:id",
  verifyToken,
  allowRoles("admin", "developer"),
  updateIncidentStatus
);

router.patch(
  "/:id/team",
  verifyToken,
  allowRoles("admin"),
  assignIncidentTeam
);

//  Delete → ADMIN only
router.delete(
  "/:id",
  verifyToken,
  allowRoles("admin"),
  deleteIncident
);

export default router;