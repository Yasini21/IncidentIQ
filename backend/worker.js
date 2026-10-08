import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";
import Incident from "./models/Incident.js";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log("DB connected (Worker)");

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "incidentQueue",
  async (job) => {
    const { incidentId } = job.data;

    try {
      console.log("Job received:", job.data);
      //For testing whether retry works
      // throw new Error("TEST RETRY");
      const incident = await Incident.findById(incidentId);
      if (!incident) {
        throw new Error(`Incident not found: ${incidentId}`);
      }

      let analysis = "";
      let suggestion = "";

      const title = incident.title.toLowerCase();

      if (title.includes("server")) {
        analysis = "Possible server overload";
        suggestion = "Restart server";
      } else if (title.includes("database")) {
        analysis = "Database connection issue";
        suggestion = "Check DB service";
      } else if (title.includes("login")) {
        analysis = "Authentication issue";
        suggestion = "Check auth service";
      } else {
        analysis = "General issue detected";
        suggestion = "Check logs manually";
      }

      incident.analysis = analysis;
      incident.suggestion = suggestion;

      await incident.save();

      console.log("Incident updated:", incident._id);
    } catch (error) {
      console.error("Incident job failed:", {
        jobId: job.id,
        incidentId,
        error,
      });
      throw error;
    }
  },
  { connection }
);

console.log("🚀 Worker started...");