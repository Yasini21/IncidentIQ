import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });

    //  HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "user",
    });

    res.status(201).json({ msg: "User registered successfully" });

  } catch (err) {
    console.error("REGISTER ERROR:", err.message);
    res.status(500).json({ msg: "Registration failed" });
  }
};

/* LOGIN USER */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user)
      return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ msg: "Invalid credentials" });

    // Convert roles from users created before the Phase 1 role migration.
    const roleMap = {
      admin: "admin",
      engineer: "developer",
      viewer: "user",
    };
    const role = roleMap[user.role] || user.role;

    if (role !== user.role) {
      user.role = role;
      await user.save();
    }

    const token = jwt.sign(
      {
        id: user._id,
        role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role
      },
      msg: "Login successful"
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err.message);
    res.status(500).json({ msg: "Login failed" });
  }
};