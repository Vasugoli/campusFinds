import { Hono } from "hono";
import { auth } from ".././middleware/auth.ts";
import { registerUser, loginUser, getMe } from "../controllers/auth_controllers.ts";

const authRoutes = new Hono();

// Register
authRoutes.post("/register", registerUser);

// Login
authRoutes.post("/login", loginUser);

// Get Me
authRoutes.get("/me", auth, getMe);

export default authRoutes;
