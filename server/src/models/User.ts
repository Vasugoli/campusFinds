import { mongoose } from "npm:mongoose";

const userSchema = new mongoose.Schema({
  displayName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatarUrl: { type: String },
  rollNo: { type: String, required: true, unique: true },
  phone: { type: String },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  isBanned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", userSchema);
