import app from "./config.ts";
import authRoutes from "./routes/auth.ts";
import itemRoutes from "./routes/items.ts";
import claimRoutes from "./routes/claims.ts";
import reportRoutes from "./routes/reports.ts";
import adminRoutes from "./routes/admin.ts";
import notificationRoutes from "./routes/notifications.ts";
import { generalRateLimit } from "./middleware/rateLimit.ts";

const PORT = parseInt(Deno.env.get("PORT") || "5000");

// Apply rate limiting to all routes
app.use("*", generalRateLimit);

// Health check route
app.get("/", (c) => {
	return c.json({
		message: "CampusFinds API is running!",
		version: "1.0.0",
		timestamp: new Date().toISOString(),
		environment: Deno.env.get("NODE_ENV") || "development",
	});
});

// API routes
app.route("/api/auth", authRoutes);
app.route("/api/items", itemRoutes);
app.route("/api/claims", claimRoutes);
app.route("/api/reports", reportRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/notifications", notificationRoutes);

// 404 handler
app.notFound((c) => {
	return c.json({ message: "Route not found" }, 404);
});

// Error handler
app.onError((err, c) => {
	console.error("Server error:", err);

	// Don't expose internal errors in production
	const isProduction = Deno.env.get("NODE_ENV") === "production";
	const message = isProduction ? "Internal server error" : err.message;

	return c.json({ message }, 500);
});

console.log(`🚀 Server starting on http://localhost:${PORT}`);
console.log(`📊 Environment: ${Deno.env.get("NODE_ENV") || "development"}`);

Deno.serve({ port: PORT }, app.fetch);
