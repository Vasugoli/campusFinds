import { Router } from "express";
import { auth } from "@/middleware/auth.ts";
import {
	registerUser,
	loginUser,
	getMe,
	refreshAccessToken,
	logoutUser,
	forgotPassword,
	resetPassword,
} from "@/controllers/auth_controllers.ts";
import { authRateLimit } from "@/middleware/rateLimit.ts";

const authRoutes = Router();

// Public auth routes (with rate limiting)
authRoutes.post("/register", authRateLimit, registerUser);
authRoutes.post("/login", authRateLimit, loginUser);
authRoutes.post("/refresh", refreshAccessToken);
authRoutes.post("/logout", logoutUser);
authRoutes.post("/forgot-password", authRateLimit, forgotPassword);
authRoutes.post("/reset-password", authRateLimit, resetPassword);

// Protected route
authRoutes.get("/me", auth, getMe);

export default authRoutes;
