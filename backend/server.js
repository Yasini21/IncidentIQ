import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import http from "http";
import { Server } from "socket.io";

import userRoutes from "./routes/userRoutes.js";
import incidentRoutes from "./routes/incidentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";

dotenv.config();
connectDB();

const app = express();

//  create server using http
//"This below line says Create an HTTP server,and whenever an HTTP request arrives,give that request to Express app"
const server = http.createServer(app);

//  attach socket
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

//  store io globally
app.set("io", io);

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);

// socket connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);
});

const PORT = process.env.PORT || 5000;

//  use server.listen.This is opened only one time then the request is again not being passed over here
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});