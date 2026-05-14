import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";
import Incident from "./models/Incident.js";
import dotenv from "dotenv";

dotenv.config();

// 🔗 connect DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("DB connected (Worker)"))
  .catch(err => console.log(err));

// 🔗 Redis connection
const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null, // ✅ FIX
});

// 👨‍🍳 Worker
const worker = new Worker(
  "incidentQueue",
  async (job) => {
    console.log("🔥 Job received:", job.data);

    const { incidentId } = job.data;

    const incident = await Incident.findById(incidentId);
    if (!incident) return;

    // 🧠 Fake analysis (business logic)
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

    // 💾 update DB
    incident.analysis = analysis;
    incident.suggestion = suggestion;

    await incident.save();

    console.log(" Incident updated:", incident._id);
  },
  { connection }
);

console.log("🚀 Worker started...");