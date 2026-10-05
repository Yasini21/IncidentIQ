import mongoose from "mongoose";
import Team from "../models/Team.js";
import User from "../models/User.js";

const isAdmin = (req) => req.user?.role === "admin";

export const getTeams = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ msg: "Access denied" });
    }

    const teams = await Team.find().sort({ name: 1 }).lean();
    const teamIds = teams.map((team) => team._id);
    const developers = await User.find({
      role: "developer",
      team: { $in: teamIds },
    })
      .select("name email team")
      .sort({ name: 1 })
      .lean();

    const membersByTeam = developers.reduce((members, developer) => {
      const teamId = developer.team.toString();
      members[teamId] = members[teamId] || [];
      members[teamId].push({
        _id: developer._id,
        name: developer.name,
        email: developer.email,
      });
      return members;
    }, {});

    res.json(
      teams.map((team) => ({
        ...team,
        members: membersByTeam[team._id.toString()] || [],
        developerCount: (membersByTeam[team._id.toString()] || []).length,
      }))
    );
  } catch (err) {
    console.error("GET TEAMS ERROR:", err.message);
    res.status(500).json({ msg: "Unable to load teams" });
  }
};

export const createTeam = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ msg: "Access denied" });
    }

    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ msg: "Team name is required" });
    }

    const team = await Team.create({ name });
    res.status(201).json(team);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ msg: "A team with that name already exists" });
    }

    console.error("CREATE TEAM ERROR:", err.message);
    res.status(500).json({ msg: "Unable to create team" });
  }
};

export const updateTeam = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ msg: "Access denied" });
    }

    const name = req.body.name?.trim();
    if (!name) {
      return res.status(400).json({ msg: "Team name is required" });
    }

    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );

    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    res.json(team);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ msg: "A team with that name already exists" });
    }

    console.error("UPDATE TEAM ERROR:", err.message);
    res.status(500).json({ msg: "Unable to update team" });
  }
};

export const deleteTeam = async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ msg: "Access denied" });
    }

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "Invalid team id" });
    }

    const developerCount = await User.countDocuments({
      role: "developer",
      team: req.params.id,
    });

    if (developerCount > 0) {
      return res.status(409).json({
        msg: "Remove all developers from the team before deleting it",
      });
    }

    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) {
      return res.status(404).json({ msg: "Team not found" });
    }

    res.json({ msg: "Team deleted successfully" });
  } catch (err) {
    console.error("DELETE TEAM ERROR:", err.message);
    res.status(500).json({ msg: "Unable to delete team" });
  }
};
