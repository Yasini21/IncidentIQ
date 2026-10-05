import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  try {
    // 🔥 Expect: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader)
      return res.status(401).json({ msg: "No token provided" });

    const token = authHeader.split(" ")[1];

    if (!token)
      return res.status(401).json({ msg: "Invalid token format" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Accept tokens issued before the Phase 1 role migration until they expire.
    const roleMap = {
      admin: "admin",
      engineer: "developer",
      viewer: "user",
    };
    decoded.role = roleMap[decoded.role] || decoded.role;

    req.user = decoded; // { id, role, email }
    next();

  } catch (err) {
    return res.status(401).json({ msg: "Invalid or expired token" });
  }
};