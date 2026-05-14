import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    console.log("REGISTER BODY:", req.body); // 🔥 debug

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ msg: "User already exists" });

    // 🔥 HASH PASSWORD
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("HASHED:", hashedPassword); // 🔥 debug

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword, // 🔥 VERY IMPORTANT
    });

    console.log("SAVED USER:", newUser); // 🔥 debug

    res.status(201).json({ msg: "User registered successfully" });

  } catch (err) {
    console.log("REGISTER ERROR:", err);
    res.status(500).json({ msg: "Registration failed" });
  }
};

/* LOGIN USER */
export const login = async (req, res) => {
  try {
    console.log("BODY:", req.body);

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    console.log("USER:", user);

    if (!user)
      return res.status(404).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("MATCH:", isMatch);

    if (!isMatch)
      return res.status(401).json({ msg: "Invalid credentials" });

    console.log("SECRET:", process.env.JWT_SECRET); // 🔥 CHECK THIS

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
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
        role: user.role
      },
      msg: "Login successful"
    });

  } catch (err) {
    console.log("ERROR:", err); // 🔥 IMPORTANT
    res.status(500).json({ msg: "Login failed" });
  }
};