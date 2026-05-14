import Incident from "../models/Incident.js";
import { incidentQueue } from "../queue/incidentQueue.js";

// CREATE INCIDENT
export const createIncident = async (req, res) => {
  try {
    console.log("BODY:", req.body); // 🔥 ADD THIS

    const incident = await Incident.create(req.body);
    await incidentQueue.add("analyzeIncident", {
        incidentId: incident._id,
    });

    console.log("CREATED:", incident); // 🔥 ADD THIS

    const io = req.app.get("io");
    io.emit("newIncident", incident);

    res.status(201).json(incident);
  } catch (error) {
    console.log("CREATE ERROR:", error); // 🔥 ADD THIS
    res.status(500).json({ message: error.message });
  }
};

// GET ALL INCIDENTS
export const getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET SINGLE INCIDENT
export const getIncidentById = async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);

    if (!incident) {
      return res.status(404).json({ message: "Incident not found" });
    }

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE STATUS
export const updateIncidentStatus = async (req, res) => {
  try {
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    const io = req.app.get("io");
    io.emit("incidentUpdated", incident); // 🔥 added

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
    const resolved = await Incident.countDocuments({ status: "RESOLVED" });

    // 🔥 Severity counts
    const low = await Incident.countDocuments({ severity: "LOW" });
    const medium = await Incident.countDocuments({ severity: "MEDIUM" });
    const high = await Incident.countDocuments({ severity: "HIGH" });

    res.json({
      total,
      open,
      resolved,
      low,
      medium,
      high,
    });

  } catch (err) {
    res.status(500).json({ msg: "Analytics error" });
  }
};