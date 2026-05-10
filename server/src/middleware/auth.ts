import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.ts";

export const auth = async (req: any, res: Response, next: NextFunction) => {
	const authHeader = req.header("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({ message: "Unauthorized" });
	}

	const token = authHeader.split(" ")[1];

	try {
		const secret = process.env.JWT_SECRET || "your-secret-key";
		const payload = jwt.verify(token, secret) as { id: string };
		
		const user = await User.findById(payload.id).select("-password");

		if (!user) {
			return res.status(401).json({ message: "Unauthorized" });
		}

		// Check if user is banned
		if (user.isBanned) {
			return res.status(403).json({ message: "Account suspended" });
		}

		req.user = user;
		next();
	} catch (error) {
		console.error("Auth error:", error);
		return res.status(401).json({ message: "Unauthorized" });
	}
};

export const admin = async (req: any, res: Response, next: NextFunction) => {
	const user = req.user;

	if (!user || user.role !== "admin") {
		return res.status(403).json({ message: "Forbidden" });
	}

	next();
};
