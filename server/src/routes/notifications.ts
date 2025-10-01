import { Hono } from "hono";
import { auth } from "../middleware/auth.ts";
import { getUserNotifications, markAsRead, markAllAsRead, deleteNotification } from "../controllers/notifications_controllers.ts";

const notificationRoutes = new Hono();

// Get user notifications
notificationRoutes.get("/", auth, getUserNotifications);

// Mark notification as read
notificationRoutes.put("/:id/read", auth, markAsRead);

// Mark all notifications as read
notificationRoutes.put("/mark-all-read", auth, markAllAsRead);

// Delete notification
notificationRoutes.delete("/:id", auth, deleteNotification);

export default notificationRoutes;
