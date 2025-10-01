import { Context } from "hono";
import { Report } from "../models/Report.ts";
import { Item } from "../models/Item.ts";
import { ActivityLogger } from "../utils/activityLogger.ts";
import { NotificationService } from "../utils/notificationService.ts";

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
export async function createReport(c: Context) {
	try {
		const user = c.get("user") as any;
		const body = await c.req.json();

		const errors = validateReportData(body);
		if (errors.length > 0) {
			return c.json({ message: "Validation failed", errors }, 400);
		}

		const { itemId, reason, description } = body;

		// Check if item exists
		const item = await Item.findById(itemId).populate(
			"reporterId",
			"displayName"
		);
		if (!item) {
			return c.json({ message: "Item not found" }, 404);
		}

		// Check if user has already reported this item
		const existingReport = await Report.findOne({
			itemId,
			reporterId: user._id,
			status: { $in: ["open", "reviewed"] },
		});

		if (existingReport) {
			return c.json(
				{ message: "You have already reported this item" },
				400
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
		if (item.reporterId._id.toString() !== user._id.toString()) {
			await NotificationService.notifyItemReported(
				item.reporterId._id.toString(),
				item.title,
				reason,
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
			Deno.env.get("AUTO_HIDE_THRESHOLD") || "5"
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

		return c.json(report, 201);
	} catch (error) {
		console.error("Create report error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Get reports (admin only)
export async function getReports(c: Context) {
	try {
		const user = c.get("user") as any;

		if (user.role !== "admin") {
			return c.json({ message: "Access denied" }, 403);
		}

		const page = parseInt(c.req.query("page") || "1");
		const limit = parseInt(c.req.query("limit") || "20");
		const status = c.req.query("status");
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

		return c.json({
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
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Review a report (admin only)
export async function reviewReport(c: Context) {
	try {
		const user = c.get("user") as any;

		if (user.role !== "admin") {
			return c.json({ message: "Access denied" }, 403);
		}

		const reportId = c.req.param("id");
		const body = await c.req.json();
		const { status, action, notes } = body;

		if (!status || !["reviewed", "resolved"].includes(status)) {
			return c.json({ message: "Valid status is required" }, 400);
		}

		const report = await Report.findById(reportId)
			.populate("itemId", "title reporterId")
			.populate("reporterId", "displayName");

		if (!report) {
			return c.json({ message: "Report not found" }, 404);
		}

		// Update report
		report.status = status;
		report.reviewedBy = user._id;
		report.reviewedAt = new Date();
		await report.save();

		// Perform admin action if specified
		if (action) {
			await performAdminAction(
				action,
				report.itemId._id.toString(),
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

		return c.json(report);
	} catch (error) {
		console.error("Review report error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

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
export async function getReport(c: Context) {
	try {
		const user = c.get("user") as any;
		const reportId = c.req.param("id");

		const report = await Report.findById(reportId)
			.populate("itemId", "title description category images")
			.populate("reporterId", "displayName email")
			.populate("reviewedBy", "displayName");

		if (!report) {
			return c.json({ message: "Report not found" }, 404);
		}

		// Only allow access to admins or the reporter
		if (
			user.role !== "admin" &&
			report.reporterId._id.toString() !== user._id.toString()
		) {
			return c.json({ message: "Access denied" }, 403);
		}

		return c.json(report);
	} catch (error) {
		console.error("Get report error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}
