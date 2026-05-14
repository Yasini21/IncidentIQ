import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,

    severity: {
      type: String,
      enum: ["P1", "P2", "P3"],
      default: "P3",
    },

    status: {
      type: String,
      enum: ["OPEN", "RESOLVED"],
      default: "OPEN",
    },

    logs: String,

    // 🔥 FIXED FIELDS
    analysis: String,
    suggestion: String,
  },
  { timestamps: true }
);

export default mongoose.model("Incident", incidentSchema);