import { Notification } from "../models/Notification.ts";
import { EmailService } from "./emailService.ts";

interface CreateNotificationData {
	userId: string;
	title: string;
	message: string;
	type: "claim" | "admin" | "general" | "report";
	relatedId?: string;
	relatedType?: "item" | "claim" | "report";
}

export class NotificationService {
	static async createNotification(
		data: CreateNotificationData
	): Promise<void> {
		try {
			await Notification.create({
				userId: data.userId,
				title: data.title,
				message: data.message,
				type: data.type,
				relatedId: data.relatedId,
				relatedType: data.relatedType,
			});
		} catch (error) {
			console.error("Failed to create notification:", error);
		}
	}

	static async getUserNotifications(
		userId: string,
		page = 1,
		limit = 20
	): Promise<{
		notifications: unknown[];
		total: number;
		unreadCount: number;
	}> {
		try {
			const skip = (page - 1) * limit;

			const [notifications, total, unreadCount] = await Promise.all([
				Notification.find({ userId })
					.sort({ createdAt: -1 })
					.skip(skip)
					.limit(limit),
				Notification.countDocuments({ userId }),
				Notification.countDocuments({ userId, isRead: false }),
			]);

			return { notifications, total, unreadCount };
		} catch (error) {
			console.error("Failed to get user notifications:", error);
			return { notifications: [], total: 0, unreadCount: 0 };
		}
	}

	static async markAsRead(
		notificationId: string,
		userId: string
	): Promise<boolean> {
		try {
			const result = await Notification.updateOne(
				{ _id: notificationId, userId },
				{ isRead: true }
			);
			return result.modifiedCount > 0;
		} catch (error) {
			console.error("Failed to mark notification as read:", error);
			return false;
		}
	}

	static async markAllAsRead(userId: string): Promise<boolean> {
		try {
			await Notification.updateMany(
				{ userId, isRead: false },
				{ isRead: true }
			);
			return true;
		} catch (error) {
			console.error("Failed to mark all notifications as read:", error);
			return false;
		}
	}

	static async deleteNotification(
		notificationId: string,
		userId: string
	): Promise<boolean> {
		try {
			const result = await Notification.deleteOne({
				_id: notificationId,
				userId,
			});
			return result.deletedCount > 0;
		} catch (error) {
			console.error("Failed to delete notification:", error);
			return false;
		}
	}

	// Convenience methods for common notification types
	static async notifyClaimReceived(
		reporterId: string,
		itemTitle: string,
		claimantName: string,
		_itemId: string,
		claimId: string
	): Promise<void> {
		await this.createNotification({
			userId: reporterId,
			title: "New Claim Received",
			message: `${claimantName} has submitted a claim for your item: ${itemTitle}`,
			type: "claim",
			relatedId: claimId,
			relatedType: "claim",
		});
	}

	static async notifyClaimResponse(
		claimantId: string,
		itemTitle: string,
		approved: boolean,
		_itemId: string,
		claimId: string
	): Promise<void> {
		const title = approved ? "Claim Approved!" : "Claim Response";
		const message = approved
			? `Your claim for ${itemTitle} has been approved!`
			: `Your claim for ${itemTitle} was not approved at this time.`;

		await this.createNotification({
			userId: claimantId,
			title,
			message,
			type: "claim",
			relatedId: claimId,
			relatedType: "claim",
		});
	}

	static async notifyItemReported(
		reporterId: string,
		itemTitle: string,
		reason: string,
		_itemId: string,
		reportId: string
	): Promise<void> {
		await this.createNotification({
			userId: reporterId,
			title: "Item Reported",
			message: `Your item "${itemTitle}" has been reported for: ${reason}`,
			type: "report",
			relatedId: reportId,
			relatedType: "report",
		});
	}

	static async notifyAdminAction(
		userId: string,
		title: string,
		message: string,
		relatedId?: string,
		relatedType?: "item" | "claim" | "report"
	): Promise<void> {
		await this.createNotification({
			userId,
			title,
			message,
			type: "admin",
			relatedId,
			relatedType,
		});
	}

	// Send both in-app notification and email
	static async sendNotificationWithEmail(
		data: CreateNotificationData & {
			userEmail: string;
			emailTemplate?: string;
			emailData?: Record<string, unknown>;
		}
	): Promise<void> {
		// Create in-app notification
		await this.createNotification(data);

		// Send email notification if template provided
		if (data.emailTemplate && data.emailData) {
			const template = EmailService.getTemplate(
				data.emailTemplate,
				data.emailData
			);
			await EmailService.sendEmail({
				to: data.userEmail,
				subject: template.subject,
				html: template.html,
				text: template.text,
			});
		}
	}
}
