import { Request, Response } from "express";
import { Report } from "@/models/Report.ts";
import { Item } from "@/models/Item.ts";
import { ActivityLogger } from "@/utils/activityLogger.ts";
import { NotificationService } from "@/utils/notificationService.ts";

// Validation helper
function validateReportData(data: Record<string, unknown>) {
	const errors: string[] = [];

	if (!data.itemId || typeof data.itemId !== "string") {
		errors.push("Item ID is required");
	}

	const validReasons = [
		"inappropriate_content",
		"spam",
		"fake_listing",
		"harassment",
		"stolen_item",
		"other",
	];

	if (!data.reason || !validReasons.includes(data.reason as string)) {
		errors.push("Valid reason is required");
	}

	if (data.description && typeof data.description !== "string") {
		errors.push("Description must be a string");
	}

	if (data.description && (data.description as string).length > 1000) {
		errors.push("Description must be less than 1000 characters");
	}

	return errors;
}

// Create a report
export const createReport = async (req: any, res: Response) => {
	try {
		const user = req.user;
		const body = req.body;

		const errors = validateReportData(body);
		if (errors.length > 0) {
			return res.status(400).json({ message: "Validation failed", errors });
		}

		const { itemId, reason, description } = body;

		// Check if item exists
		const item = await Item.findById(itemId).populate(
			"reporterId",
			"displayName"
		);
		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}

		// Check if user has already reported this item
		const existingReport = await Report.findOne({
			itemId,
			reporterId: user._id,
			status: { $in: ["open", "reviewed"] },
		});

		if (existingReport) {
			return res.status(400).json(
				{ message: "You have already reported this item" }
			);
		}

		// Create the report
		const report = new Report({
			itemId,
			reporterId: user._id,
			reason,
			description,
		});

		await report.save();
		await report.populate([
			{ path: "reporterId", select: "displayName" },
			{ path: "itemId", select: "title" },
		]);

		// Log activity
		await ActivityLogger.log({
			actor: user._id.toString(),
			action: "item_reported",
			target: "item",
			targetId: itemId,
			metadata: { reportId: report._id.toString(), reason },
		});

		// Notify item owner (if not the reporter)
		if ((item.reporterId as any)._id.toString() !== user._id.toString()) {
			await NotificationService.notifyItemReported(
				(item.reporterId as any)._id.toString(),
				item.title,
				reason as any,
				itemId,
				report._id.toString()
			);
		}

		// Check if item should be auto-hidden (configurable threshold)
		const reportCount = await Report.countDocuments({
			itemId,
			status: { $in: ["open", "reviewed"] },
		});

		const autoHideThreshold = parseInt(
			process.env.AUTO_HIDE_THRESHOLD || "5"
		);
		if (reportCount >= autoHideThreshold) {
			await Item.findByIdAndUpdate(itemId, {
				visibility: "private",
			});

			// Log auto-hide action
			await ActivityLogger.log({
				actor: "system",
				action: "admin_action",
				target: "item",
				targetId: itemId,
				metadata: { action: "auto_hide", reportCount },
			});
		}

		res.status(201).json(report);
	} catch (error) {
		console.error("Create report error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get reports (admin only)
export const getReports = async (req: any, res: Response) => {
	try {
		const user = req.user;

		if (user.role !== "admin") {
			return res.status(403).json({ message: "Access denied" });
		}

		const page = parseInt((req.query.page as string) || "1");
		const limit = parseInt((req.query.limit as string) || "20");
		const status = req.query.status as string;
		const skip = (page - 1) * limit;

		const query: Record<string, unknown> = {};
		if (status && ["open", "reviewed", "resolved"].includes(status)) {
			query.status = status;
		}

		const reports = await Report.find(query)
			.populate("itemId", "title description category images")
			.populate("reporterId", "displayName email")
			.populate("reviewedBy", "displayName")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const total = await Report.countDocuments(query);
		const stats = await Report.aggregate([
			{
				$group: {
					_id: "$status",
					count: { $sum: 1 },
				},
			},
		]);

		res.json({
			reports,
			stats: stats.reduce((acc, stat) => {
				acc[stat._id] = stat.count;
				return acc;
			}, {}),
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Get reports error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Review a report (admin only)
export const reviewReport = async (req: any, res: Response) => {
	try {
		const user = req.user;

		if (user.role !== "admin") {
			return res.status(403).json({ message: "Access denied" });
		}

		const reportId = req.params.id;
		const body = req.body;
		const { status, action, notes } = body;

		if (!status || !["reviewed", "resolved"].includes(status)) {
			return res.status(400).json({ message: "Valid status is required" });
		}

		const report = await Report.findById(reportId)
			.populate("itemId", "title reporterId")
			.populate("reporterId", "displayName");

		if (!report) {
			return res.status(404).json({ message: "Report not found" });
		}

		// Update report
		report.status = status as any;
		report.reviewedBy = user._id;
		report.reviewedAt = new Date();
		await report.save();

		// Perform admin action if specified
		if (action) {
			await performAdminAction(
				action,
				(report.itemId as any)._id.toString(),
				user._id.toString(),
				notes
			);
		}

		// Log activity
		await ActivityLogger.log({
			actor: user._id.toString(),
			action: "report_reviewed",
			target: "report",
			targetId: reportId,
			metadata: { status, action, notes },
		});

		res.json(report);
	} catch (error) {
		console.error("Review report error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

async function performAdminAction(
	action: string,
	itemId: string,
	adminId: string,
	notes?: string
): Promise<void> {
	switch (action) {
		case "hide_item":
			await Item.findByIdAndUpdate(itemId, { visibility: "private" });
			break;
		case "delete_item":
			await Item.findByIdAndDelete(itemId);
			break;
		case "warn_user":
			// Implementation would depend on warning system
			break;
		case "ban_user":
			// Implementation would depend on user management
			break;
		default:
			// no_action or unknown action
			break;
	}

	// Log the admin action
	await ActivityLogger.log({
		actor: adminId,
		action: "admin_action",
		target: "item",
		targetId: itemId,
		metadata: { action, notes },
	});
}

// Get report details
export const getReport = async (req: any, res: Response) => {
	try {
		const user = req.user;
		const reportId = req.params.id;

		const report = await Report.findById(reportId)
			.populate("itemId", "title description category images")
			.populate("reporterId", "displayName email")
			.populate("reviewedBy", "displayName");

		if (!report) {
			return res.status(404).json({ message: "Report not found" });
		}

		// Only allow access to admins or the reporter
		if (
			user.role !== "admin" &&
			(report.reporterId as any)._id.toString() !== user._id.toString()
		) {
			return res.status(403).json({ message: "Access denied" });
		}

		res.json(report);
	} catch (error) {
		console.error("Get report error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
