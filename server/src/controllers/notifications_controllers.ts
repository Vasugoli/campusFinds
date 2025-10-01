import { Context } from "hono";
import { NotificationService } from "../utils/notificationService.ts";

// Get user notifications
export async function getUserNotifications(c: Context) {
	try {
		const user = c.get("user") as { _id: string };
		const page = parseInt(c.req.query("page") || "1");
		const limit = parseInt(c.req.query("limit") || "20");

		const result = await NotificationService.getUserNotifications(
			user._id,
			page,
			limit
		);

		return c.json(result);
	} catch (error) {
		console.error("Get notifications error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Mark notification as read
export async function markAsRead(c: Context) {
	try {
		const user = c.get("user") as { _id: string };
		const notificationId = c.req.param("id");

		const success = await NotificationService.markAsRead(
			notificationId,
			user._id
		);

		if (!success) {
			return c.json({ message: "Notification not found" }, 404);
		}

		return c.json({ message: "Notification marked as read" });
	} catch (error) {
		console.error("Mark notification as read error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Mark all notifications as read
export async function markAllAsRead(c: Context) {
	try {
		const user = c.get("user") as { _id: string };

		await NotificationService.markAllAsRead(user._id);

		return c.json({ message: "All notifications marked as read" });
	} catch (error) {
		console.error("Mark all notifications as read error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Delete notification
export async function deleteNotification(c: Context) {
	try {
		const user = c.get("user") as { _id: string };
		const notificationId = c.req.param("id");

		const success = await NotificationService.deleteNotification(
			notificationId,
			user._id
		);

		if (!success) {
			return c.json({ message: "Notification not found" }, 404);
		}

		return c.json({ message: "Notification deleted" });
	} catch (error) {
		console.error("Delete notification error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}
