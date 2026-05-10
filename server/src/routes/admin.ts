import { Router } from "express";
import { admin, auth } from "@/middleware/auth.ts";
import {
	adminDashboard,
	banUsers,
	deleteItem,
	exportData,
	getActivityLogs,
	getItems,
	getUsers,
	sendBroadcast,
	updateItemVisibility,
	updateUserRole,
} from "@/controllers/admin_controllers.ts";

const adminRoutes = Router();

// Apply admin middleware to all routes
adminRoutes.use(auth, admin);

// Get dashboard statistics
adminRoutes.get("/dashboard", adminDashboard);

// User management
adminRoutes.get("/users", getUsers);

// Update user role
adminRoutes.put("/users/:id/role", updateUserRole);

// Ban/unban user
adminRoutes.put("/users/:id/ban", banUsers);

// Get all items for moderation
adminRoutes.get("/items", getItems);

// Hide/show item
adminRoutes.put("/items/:id/visibility", updateItemVisibility);

// Delete item
adminRoutes.delete("/items/:id", deleteItem);

// Export data
adminRoutes.get("/export/:type", exportData);

// Send broadcast notification
adminRoutes.post("/broadcast", sendBroadcast);

// Get activity logs
adminRoutes.get("/activity", getActivityLogs);

export default adminRoutes;
