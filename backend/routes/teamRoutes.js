import express from "express";
import {
  createTeam,
  deleteTeam,
  getTeams,
  updateTeam,
} from "../controllers/teamController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();
const adminOnly = [verifyToken, allowRoles("admin")];

router.get("/", ...adminOnly, getTeams);
router.post("/", ...adminOnly, createTeam);
router.patch("/:id", ...adminOnly, updateTeam);
router.delete("/:id", ...adminOnly, deleteTeam);

export default router;
