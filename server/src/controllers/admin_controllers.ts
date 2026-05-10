import { Request, Response } from "express";
import { Claim } from "@/models/Claim.ts";
import { EmailService } from "@/utils/emailService.ts";
import { Notification } from "@/models/Notification.ts";
import { NotificationService } from "@/utils/notificationService.ts";
import { ActivityLogger } from "@/utils/activityLogger.ts";
import { ActivityLog } from "@/models/ActivityLog.ts";
import { Report } from "@/models/Report.ts";
import { User } from "@/models/User.ts";
import { Item } from "@/models/Item.ts";

export const adminDashboard = async (req: Request, res: Response) => {
	try {
		const [
			totalUsers,
			totalItems,
			totalClaims,
			totalReports,
			recentActivity,
			userStats,
			itemStats,
		] = await Promise.all([
			User.countDocuments(),
			Item.countDocuments(),
			Claim.countDocuments(),
			Report.countDocuments(),
			ActivityLog.find()
				.sort({ timestamp: -1 })
				.limit(10)
				.populate("actor", "displayName"),
			User.aggregate([
				{
					$group: {
						_id: "$role",
						count: { $sum: 1 },
					},
				},
			]),
			Item.aggregate([
				{
					$group: {
						_id: "$status",
						count: { $sum: 1 },
					},
				},
			]),
		]);
		const pendingReports = await Report.countDocuments({ status: "open" });
		const pendingClaims = await Claim.countDocuments({ status: "pending" });
		res.json({
			totals: {
				users: totalUsers,
				items: totalItems,
				claims: totalClaims,
				reports: totalReports,
				pendingReports,
				pendingClaims,
			},
			userStats: userStats.reduce((acc, stat) => {
				acc[stat._id] = stat.count;
				return acc;
			}, {}),
			itemStats: itemStats.reduce((acc, stat) => {
				acc[stat._id] = stat.count;
				return acc;
			}, {}),
			recentActivity,
		});
	} catch (error) {
		console.error("Dashboard error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const getUsers = async (req: Request, res: Response) => {
	try {
		const page = parseInt((req.query.page as string) || "1");
		const limit = parseInt((req.query.limit as string) || "20");
		const search = req.query.search as string;
		const role = req.query.role as string;
		const skip = (page - 1) * limit;
		const query: Record<string, unknown> = {};
		if (search) {
			query.$or = [
				{ displayName: { $regex: search, $options: "i" } },
				{ email: { $regex: search, $options: "i" } },
				{ rollNo: { $regex: search, $options: "i" } },
			];
		}
		if (role && ["user", "admin"].includes(role)) {
			query.role = role;
		}
		const users = await User.find(query)
			.select("-password")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);
		const total = await User.countDocuments(query);
		res.json({
			users,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Get users error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const updateUserRole = async (req: any, res: Response) => {
	try {
		const adminUser = req.user as { _id: string; displayName: string };
		const userId = req.params.id;
		const { role } = req.body;
		if (!["user", "admin"].includes(role)) {
			return res.status(400).json({ message: "Invalid role" });
		}
		const user = await User.findByIdAndUpdate(
			userId,
			{ role },
			{ new: true },
		).select("-password");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		// Log activity
		await ActivityLogger.log({
			actor: adminUser._id,
			action: "role_changed",
			target: "user",
			targetId: userId,
			metadata: { newRole: role, oldRole: user.role },
		});
		// Notify user
		await NotificationService.notifyAdminAction(
			userId,
			"Role Updated",
			`Your role has been updated to ${role} by an administrator.`,
		);
		res.json(user);
	} catch (error) {
		console.error("Update user role error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const banUsers = async (req: any, res: Response) => {
	try {
		const adminUser = req.user as { _id: string; displayName: string };
		const userId = req.params.id;
		const { isBanned, reason } = req.body;
		const user = await User.findByIdAndUpdate(
			userId,
			{ isBanned },
			{ new: true },
		).select("-password");
		if (!user) {
			return res.status(404).json({ message: "User not found" });
		}
		// Log activity
		await ActivityLogger.log({
			actor: adminUser._id,
			action: isBanned ? "user_banned" : "user_unbanned",
			target: "user",
			targetId: userId,
			metadata: { reason },
		});
		// Notify user
		const title = isBanned ? "Account Suspended" : "Account Restored";
		const message = isBanned
			? `Your account has been suspended. ${reason ? `Reason: ${reason}` : ""}`
			: "Your account has been restored and you can now access the platform.";
		await NotificationService.notifyAdminAction(userId, title, message);
		res.json(user);
	} catch (error) {
		console.error("Ban user error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const getItems = async (req: Request, res: Response) => {
	try {
		const page = parseInt((req.query.page as string) || "1");
		const limit = parseInt((req.query.limit as string) || "20");
		const status = req.query.status as string;
		const visibility = req.query.visibility as string;
		const skip = (page - 1) * limit;
		const query: Record<string, unknown> = {};
		if (status && ["lost", "found", "returned"].includes(status)) {
			query.status = status;
		}
		if (visibility && ["public", "private"].includes(visibility)) {
			query.visibility = visibility;
		}
		const items = await Item.find(query)
			.populate("reporterId", "displayName email")
			.populate("claimedBy", "displayName")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);
		const total = await Item.countDocuments(query);
		res.json({
			items,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Get admin items error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const updateItemVisibility = async (req: any, res: Response) => {
	try {
		const adminUser = req.user as { _id: string };
		const itemId = req.params.id;
		const { visibility } = req.body;
		if (!["public", "private"].includes(visibility)) {
			return res.status(400).json({ message: "Invalid visibility" });
		}
		const item = await Item.findByIdAndUpdate(
			itemId,
			{ visibility },
			{ new: true },
		).populate("reporterId", "displayName");
		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}
		// Log activity
		await ActivityLogger.log({
			actor: adminUser._id,
			action: "admin_action",
			target: "item",
			targetId: itemId,
			metadata: {
				action: visibility === "private" ? "hide_item" : "show_item",
			},
		});
		res.json(item);
	} catch (error) {
		console.error("Update item visibility error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const deleteItem = async (req: any, res: Response) => {
	try {
		const adminUser = req.user as { _id: string };
		const itemId = req.params.id;
		const item = await Item.findById(itemId);
		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}
		await Item.findByIdAndDelete(itemId);
		// Log activity
		await ActivityLogger.log({
			actor: adminUser._id,
			action: "admin_action",
			target: "item",
			targetId: itemId,
			metadata: { action: "delete_item", itemTitle: item.title },
		});
		res.json({ message: "Item deleted" });
	} catch (error) {
		console.error("Delete item error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const exportData = async (req: Request, res: Response) => {
	try {
		const type = req.params.type;
		const format = req.query.format || "json";
		let data;
		switch (type) {
			case "users":
				data = await User.find().select("-password");
				break;
			case "items":
				data = await Item.find().populate("reporterId", "displayName email");
				break;
			case "reports":
				data = await Report.find()
					.populate("itemId", "title")
					.populate("reporterId", "displayName email");
				break;
			case "claims":
				data = await Claim.find()
					.populate("itemId", "title")
					.populate("claimantId", "displayName email")
					.populate("reporterId", "displayName email");
				break;
			default:
				return res.status(400).json({ message: "Invalid export type" });
		}
		if (format === "csv") {
			// Simple CSV conversion (in production, use a proper CSV library)
			const csvData = convertToCSV(data as any);
			res.set("Content-Type", "text/csv");
			res.set("Content-Disposition", `attachment; filename="${type}.csv"`);
			return res.send(csvData);
		}
		res.json(data);
	} catch (error) {
		console.error("Export error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

function convertToCSV(data: any[]): string {
	if (!data.length) return "";
	const headers = Object.keys(data[0].toObject ? data[0].toObject() : data[0]);
	const csvHeaders = headers.join(",");
	const csvRows = data.map((row) => {
		const obj = row.toObject ? row.toObject() : row;
		const values = headers.map((header) => {
			const val = obj[header];
			return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
		});
		return values.join(",");
	});
	return [csvHeaders, ...csvRows].join("\n");
}

export const sendBroadcast = async (req: any, res: Response) => {
	try {
		const adminUser = req.user as { _id: string; displayName: string };
		const { subject, message, recipients = "all" } = req.body;
		if (!subject || !message) {
			return res.status(400).json({ message: "Subject and message are required" });
		}
		// Get recipient users
		const query: Record<string, unknown> = {};
		if (recipients === "admins") {
			query.role = "admin";
		} else if (recipients === "users") {
			query.role = "user";
		}
		const users = await User.find(query).select("_id email displayName");
		// Send notifications
		const notifications = users.map((user) => ({
			userId: user._id.toString(),
			title: subject,
			message,
			type: "admin" as const,
		}));
		// Create notifications in batches
		await Notification.insertMany(notifications);
		// Send emails
		const emails = users.map((user) => user.email);
		await EmailService.sendAdminBroadcast(emails, subject, message);
		// Log activity
		await ActivityLogger.log({
			actor: adminUser._id,
			action: "admin_action",
			target: "notification",
			metadata: {
				action: "broadcast",
				recipients: recipients,
				recipientCount: users.length,
				subject,
			},
		});
		res.json({
			message: "Broadcast sent successfully",
			recipientCount: users.length,
		});
	} catch (error) {
		console.error("Broadcast error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

export const getActivityLogs = async (req: Request, res: Response) => {
	try {
		const page = parseInt((req.query.page as string) || "1");
		const limit = parseInt((req.query.limit as string) || "50");
		const action = req.query.action as string;
		const skip = (page - 1) * limit;
		const query: Record<string, unknown> = {};
		if (action) {
			query.action = action;
		}
		const logs = await ActivityLog.find(query)
			.populate("actor", "displayName email")
			.sort({ timestamp: -1 })
			.skip(skip)
			.limit(limit);
		const total = await ActivityLog.countDocuments(query);
		res.json({
			logs,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Get activity logs error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
