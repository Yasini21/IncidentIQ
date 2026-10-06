import mongoose from "mongoose";
import Incident from "../models/Incident.js";
import Team from "../models/Team.js";
import { incidentQueue } from "../queue/incidentQueue.js";

// CREATE INCIDENT
export const createIncident = async (req, res) => {
  try {
    const { title, description, service, logs } = req.body;
    const incident = await Incident.create({
      title,
      description,
      service,
      logs,
      reportedBy: req.user.id,
      status: "OPEN",
      assignedTeam: null,
      resolution: null,
    });
    await incidentQueue.add("analyzeIncident", {
        incidentId: incident._id,
    });

    await incident.populate([
      { path: "reportedBy", select: "name" },
      { path: "assignedTeam", select: "name" },
    ]);

    const io = req.app.get("io");
    io.emit("newIncident");

    res.status(201).json(incident);
  } catch (error) {
    console.log("CREATE ERROR:", error); 
    res.status(500).json({ message: error.message });
  }
};

// GET ALL INCIDENTS
export const getIncidents = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === "user") {
      filter = { reportedBy: req.user.id };
    } else if (req.user.role === "developer") {
      if (!req.user.team) {
        return res.json([]);
      }
      filter = { assignedTeam: req.user.team };
    }

    let incidentsQuery = Incident.find(filter);
    if (req.user.role === "user") {
      incidentsQuery = incidentsQuery.select(
        "title description service severity status reportedBy assignedTeam resolution createdAt updatedAt"
      );
    }
    const incidents = await incidentsQuery
      .populate("reportedBy", "name")
      .populate("assignedTeam", "name")
      .sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE INCIDENT
export const getIncidentById = async (req, res) => {
  try {
    let incidentQuery = Incident.findById(req.params.id);
    if (req.user.role === "user") {
      incidentQuery = incidentQuery.select(
        "title description service severity status reportedBy assignedTeam resolution createdAt updatedAt"
      );
    }
    const incident = await incidentQuery;

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    if (
      req.user.role === "user" &&
      incident.reportedBy.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "You are not authorized to view this incident.",
      });
    }

    if (
      req.user.role === "developer" &&
      (!req.user.team ||
        incident.assignedTeam?.toString() !== req.user.team.toString())
    ) {
      return res.status(403).json({
        message: "You are not authorized to view this incident.",
      });
    }

    await incident.populate([
      { path: "reportedBy", select: "name" },
      { path: "assignedTeam", select: "name" },
    ]);

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE STATUS
export const updateIncidentStatus = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      const updates = {};
      if (req.body.status) updates.status = req.body.status;
      if (req.body.severity) updates.severity = req.body.severity;

      const incident = await Incident.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true, runValidators: true }
      )
        .populate("reportedBy", "name")
        .populate("assignedTeam", "name");

      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }

      const io = req.app.get("io");
      io.emit("incidentUpdated", incident);
      return res.json(incident);
    }

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    if (
      !req.user.team ||
      incident.assignedTeam?.toString() !== req.user.team.toString()
    ) {
      return res.status(403).json({
        message: "You are not authorized to update this incident.",
      });
    }

    const body = req.body || {};
    const unsupportedFields = Object.keys(body).filter(
      (field) => !["status", "resolution"].includes(field)
    );
    if (unsupportedFields.length > 0) {
      return res.status(400).json({
        message: "Developers can update only status and resolution.",
      });
    }

    if (
      Object.hasOwn(body, "status") &&
      !["OPEN", "IN_PROGRESS", "RESOLVED"].includes(body.status)
    ) {
      return res.status(400).json({ message: "Invalid incident status." });
    }

    if (
      Object.hasOwn(body, "resolution") &&
      body.resolution !== null &&
      typeof body.resolution !== "string"
    ) {
      return res.status(400).json({
        message: "Resolution must be text or null.",
      });
    }

    const resolution = Object.hasOwn(body, "resolution")
      ? body.resolution?.trim() || null
      : incident.resolution?.trim() || null;
    const status = Object.hasOwn(body, "status")
      ? body.status
      : incident.status;

    if (status === "RESOLVED" && !resolution) {
      return res.status(400).json({
        message: "A resolution is required when resolving an incident.",
      });
    }

    if (Object.hasOwn(body, "status")) incident.status = body.status;
    if (Object.hasOwn(body, "resolution")) incident.resolution = resolution;

    await incident.save();
    await incident.populate([
      { path: "reportedBy", select: "name" },
      { path: "assignedTeam", select: "name" },
    ]);

    const io = req.app.get("io");
    io.emit("incidentUpdated", incident);

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const assignIncidentTeam = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied: only admin can assign teams" });
    }

    const { teamId } = req.body;

    if (teamId === undefined) {
      return res.status(400).json({ message: "teamId is required" });
    }

    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    if (teamId === null) {
      incident.assignedTeam = null;
      await incident.save();

      await incident.populate([
        { path: "reportedBy", select: "name" },
        { path: "assignedTeam", select: "name" },
      ]);

      const io = req.app.get("io");
      io.emit("incidentUpdated", incident);
      return res.json(incident);
    }

    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: "Invalid teamId" });
    }

    const team = await Team.findById(teamId);

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    incident.assignedTeam = team._id;
    await incident.save();

    await incident.populate([
      { path: "reportedBy", select: "name" },
      { path: "assignedTeam", select: "name" },
    ]);

    const io = req.app.get("io");
    io.emit("incidentUpdated", incident);

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE INCIDENT
export const deleteIncident = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied: only admin can delete incidents",
      });
    }

    const { id } = req.params;
    const incident = await Incident.findById(id);

    if (!incident) {
      return res.status(404).json({
        message: "Incident not found",
      });
    }
    await Incident.findByIdAndDelete(id);

    // 📡 4. Emit socket event
    const io = req.app.get("io");
    io.emit("incidentDeleted", id);
    res.status(200).json({
      message: "Incident deleted successfully",
      deletedId: id,
    });

  } catch (error) {
    console.error("DELETE ERROR:", error);

    res.status(500).json({
      message: "Server error while deleting incident",
    });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const total = await Incident.countDocuments();

    const open = await Incident.countDocuments({ status: "OPEN" });
    const inProgress = await Incident.countDocuments({ status: "IN_PROGRESS" });
    const resolved = await Incident.countDocuments({ status: "RESOLVED" });

    const p1 = await Incident.countDocuments({ severity: "P1" });
    const p2 = await Incident.countDocuments({ severity: "P2" });
    const p3 = await Incident.countDocuments({ severity: "P3" });
    const p4 = await Incident.countDocuments({ severity: "P4" });

    res.json({
      total,
      open,
      inProgress,
      resolved,
      p1,
      p2,
      p3,
      p4,
    });

  } catch (err) {
    res.status(500).json({ msg: "Analytics error" });
  }
};