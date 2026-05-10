import { Request, Response } from "express";
import { NotificationService } from "@/utils/notificationService.ts";

// Get user notifications
export const getUserNotifications = async (req: any, res: Response) => {
	try {
		const user = req.user as { _id: string };
		const page = parseInt((req.query.page as string) || "1");
		const limit = parseInt((req.query.limit as string) || "20");

		const result = await NotificationService.getUserNotifications(
			user._id,
			page,
			limit
		);

		res.json(result);
	} catch (error) {
		console.error("Get notifications error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Mark notification as read
export const markAsRead = async (req: any, res: Response) => {
	try {
		const user = req.user as { _id: string };
		const notificationId = req.params.id;

		const success = await NotificationService.markAsRead(
			notificationId,
			user._id
		);

		if (!success) {
			return res.status(404).json({ message: "Notification not found" });
		}

		res.json({ message: "Notification marked as read" });
	} catch (error) {
		console.error("Mark notification as read error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Mark all notifications as read
export const markAllAsRead = async (req: any, res: Response) => {
	try {
		const user = req.user as { _id: string };

		await NotificationService.markAllAsRead(user._id);

		res.json({ message: "All notifications marked as read" });
	} catch (error) {
		console.error("Mark all notifications as read error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Delete notification
export const deleteNotification = async (req: any, res: Response) => {
	try {
		const user = req.user as { _id: string };
		const notificationId = req.params.id;

		const success = await NotificationService.deleteNotification(
			notificationId,
			user._id
		);

		if (!success) {
			return res.status(404).json({ message: "Notification not found" });
		}

		res.json({ message: "Notification deleted" });
	} catch (error) {
		console.error("Delete notification error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
