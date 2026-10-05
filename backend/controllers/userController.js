import mongoose from "mongoose";
import User from "../models/User.js";
import Team from "../models/Team.js";

// GET ALL USERS (admin only)
export const getUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const users = await User.find().select("-password").populate("team", "name");

    res.json(users);

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    // Only admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const { id } = req.params;
    const { role } = req.body;

    // Validate role
    const allowedRoles = ["admin", "developer", "user"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role, ...(role === "developer" ? {} : { team: null }) },
      { new: true, runValidators: true }
    ).populate("team", "name");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      msg: "Role updated successfully",
      user,
    });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

export const updateUserTeam = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const { id } = req.params;
    const { teamId = null } = req.body;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.role !== "developer") {
      return res.status(400).json({ msg: "Only developers can belong to a team" });
    }

    if (teamId !== null && !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ msg: "Invalid team id" });
    }

    if (teamId !== null) {
      const team = await Team.findById(teamId);
      if (!team) {
        return res.status(404).json({ msg: "Team not found" });
      }
    }

    user.team = teamId;
    await user.save();
    await user.populate("team", "name");

    res.json({
      msg: teamId ? "Developer assigned to team" : "Developer removed from team",
      user,
    });
  } catch (err) {
    console.error("UPDATE USER TEAM ERROR:", err.message);
    res.status(500).json({ msg: "Unable to update developer team" });
  }
};