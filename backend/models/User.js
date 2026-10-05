import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please use a valid email"]
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false // hide password
    },
    role: {
      type: String,
      enum: ["admin", "developer", "user"],
      default: "user"
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null
    }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);