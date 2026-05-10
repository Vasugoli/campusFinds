import app from "./config.ts";
import authRoutes from "./routes/auth.ts";
import itemRoutes from "./routes/items.ts";
import claimRoutes from "./routes/claims.ts";
import reportRoutes from "./routes/reports.ts";
import adminRoutes from "./routes/admin.ts";
import notificationRoutes from "./routes/notifications.ts";
import { generalRateLimit } from "./middleware/rateLimit.ts";
import { Request, Response, NextFunction } from "express";

const PORT = parseInt(process.env.PORT || "5000");

// Apply rate limiting to all routes
app.use(generalRateLimit);

// Health check route
app.get("/", (req: Request, res: Response) => {
	res.json({
		message: "CampusFinds API is running!",
		version: "1.0.0",
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || "development",
	});
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/claims", claimRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
	res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
	console.error("Server error:", err);

	// Don't expose internal errors in production
	const isProduction = process.env.NODE_ENV === "production";
	const message = isProduction ? "Internal server error" : err.message;

	res.status(500).json({ message });
});

app.listen(PORT, () => {
	console.log(`🚀 Server starting on http://localhost:${PORT}`);
	console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});
