import { Queue } from "bullmq";
import IORedis from "ioredis";

// 🔐 safe local Redis connection
const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
  maxRetriesPerRequest: null, // ✅ FIX
});

// 🎯 create queue
export const incidentQueue = new Queue("incidentQueue", {
  connection,
});