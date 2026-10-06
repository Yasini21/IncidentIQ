import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  let decoded;

  try {
    // 🔥 Expect: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader)
      return res.status(401).json({ msg: "No token provided" });

    const token = authHeader.split(" ")[1];

    if (!token)
      return res.status(401).json({ msg: "Invalid token format" });

    decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Accept tokens issued before the Phase 1 role migration until they expire.
    const roleMap = {
      admin: "admin",
      engineer: "developer",
      viewer: "user",
    };
    decoded.role = roleMap[decoded.role] || decoded.role;

  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }

  if (decoded.role === "developer") {
    const user = await User.findById(decoded.id).select("team");
    decoded.team = user?.team || null;
  }

  req.user = decoded;
  next();
};