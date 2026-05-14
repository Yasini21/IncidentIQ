import express from "express";
import { getUsers, updateUserRole } from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getUsers);
router.patch("/:id/role", verifyToken, updateUserRole);

export default router;