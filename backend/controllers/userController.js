import User from "../models/User.js";

// 🔥 GET ALL USERS (admin only)
export const getUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const users = await User.find().select("-password");

    res.json(users);

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    // 🔐 Only admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Access denied" });
    }

    const { id } = req.params;
    const { role } = req.body;

    // ✅ Validate role
    const allowedRoles = ["admin", "engineer", "viewer"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true }
    );

    res.json({
      msg: "Role updated successfully",
      user,
    });

  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
};