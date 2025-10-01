import { Context } from "hono";
import { Claim } from "../models/Claim.ts";
import { Item } from "../models/Item.ts";
import { ActivityLogger } from "../utils/activityLogger.ts";
import { NotificationService } from "../utils/notificationService.ts";
import { EmailService } from "../utils/emailService.ts";

// Validation helper
function validateClaimData(data: Record<string, unknown>) {
	const errors: string[] = [];

	if (!data.itemId || typeof data.itemId !== "string") {
		errors.push("Item ID is required");
	}

	if (data.message && typeof data.message !== "string") {
		errors.push("Message must be a string");
	}

	if (data.message && (data.message as string).length > 1000) {
		errors.push("Message must be less than 1000 characters");
	}

	return errors;
}

function validateClaimResponse(data: Record<string, unknown>) {
	const errors: string[] = [];

	if (
		!data.status ||
		!["approved", "denied", "returned"].includes(data.status as string)
	) {
		errors.push("Status must be approved, denied, or returned");
	}

	if (data.responseMessage && typeof data.responseMessage !== "string") {
		errors.push("Response message must be a string");
	}

	if (
		data.responseMessage &&
		(data.responseMessage as string).length > 1000
	) {
		errors.push("Response message must be less than 1000 characters");
	}

	return errors;
}

// Create a claim
export async function createClaim(c: Context) {
	try {
		const user = c.get("user");
		const body = await c.req.json();

		const errors = validateClaimData(body);
		if (errors.length > 0) {
			return c.json({ message: "Validation failed", errors }, 400);
		}

		const { itemId, message } = body;

		// Check if item exists and is claimable
		const item = await Item.findById(itemId).populate(
			"reporterId",
			"displayName email"
		);
		if (!item) {
			return c.json({ message: "Item not found" }, 404);
		}

		if (item.status === "returned") {
			return c.json(
				{ message: "This item has already been returned" },
				400
			);
		}

		if (item.reporterId._id.toString() === user._id.toString()) {
			return c.json({ message: "You cannot claim your own item" }, 400);
		}

		// Check if user has already claimed this item
		const existingClaim = await Claim.findOne({
			itemId,
			claimantId: user._id,
			status: { $in: ["pending", "approved"] },
		});

		if (existingClaim) {
			return c.json(
				{ message: "You have already claimed this item" },
				400
			);
		}

		// Create the claim
		const claim = new Claim({
			itemId,
			claimantId: user._id,
			reporterId: item.reporterId._id,
			message,
		});

		await claim.save();
		await claim.populate([
			{ path: "claimantId", select: "displayName email avatarUrl" },
			{ path: "itemId", select: "title" },
		]);

		// Log activity
		await ActivityLogger.log({
			actor: user._id.toString(),
			action: "item_claimed",
			target: "item",
			targetId: itemId,
			metadata: { claimId: claim._id.toString() },
		});

		// Send notifications
		await NotificationService.notifyClaimReceived(
			item.reporterId._id.toString(),
			item.title,
			user.displayName,
			itemId,
			claim._id.toString()
		);

		// Send email notification
		await EmailService.sendClaimNotification(item.reporterId.email, {
			reporterName: item.reporterId.displayName,
			claimantName: user.displayName,
			itemTitle: item.title,
			itemId,
			claimMessage: message,
		});

		return c.json(claim, 201);
	} catch (error) {
		console.error("Create claim error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Get user's claims (as claimant)
export async function getMyClaims(c: Context) {
	try {
		const user = c.get("user");
		const page = parseInt(c.req.query("page") || "1");
		const limit = parseInt(c.req.query("limit") || "10");
		const skip = (page - 1) * limit;

		const claims = await Claim.find({ claimantId: user._id })
			.populate("itemId", "title description images category location")
			.populate("reporterId", "displayName avatarUrl")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const total = await Claim.countDocuments({ claimantId: user._id });

		return c.json({
			claims,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Get my claims error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Get claims for user's items (as reporter)
export async function getReceivedClaims(c: Context) {
	try {
		const user = c.get("user");
		const page = parseInt(c.req.query("page") || "1");
		const limit = parseInt(c.req.query("limit") || "10");
		const skip = (page - 1) * limit;

		const claims = await Claim.find({ reporterId: user._id })
			.populate("itemId", "title description images category location")
			.populate("claimantId", "displayName avatarUrl")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const total = await Claim.countDocuments({ reporterId: user._id });

		return c.json({
			claims,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Get received claims error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Respond to a claim
export async function respondToClaim(c: Context) {
	try {
		const user = c.get("user");
		const claimId = c.req.param("id");
		const body = await c.req.json();

		const errors = validateClaimResponse(body);
		if (errors.length > 0) {
			return c.json({ message: "Validation failed", errors }, 400);
		}

		const { status, responseMessage } = body;

		const claim = await Claim.findById(claimId)
			.populate("itemId", "title")
			.populate("claimantId", "displayName email")
			.populate("reporterId", "displayName");

		if (!claim) {
			return c.json({ message: "Claim not found" }, 404);
		}

		if (claim.reporterId._id.toString() !== user._id.toString()) {
			return c.json(
				{ message: "You can only respond to claims for your items" },
				403
			);
		}

		if (claim.status !== "pending") {
			return c.json(
				{ message: "This claim has already been responded to" },
				400
			);
		}

		// Update claim
		claim.status = status;
		claim.responseMessage = responseMessage;
		claim.respondedAt = new Date();
		await claim.save();

		// Update item status if approved or returned
		if (status === "approved") {
			await Item.findByIdAndUpdate(claim.itemId._id, {
				claimedBy: claim.claimantId._id,
			});
		} else if (status === "returned") {
			await Item.findByIdAndUpdate(claim.itemId._id, {
				status: "returned",
				claimedBy: claim.claimantId._id,
			});
		}

		// Log activity
		await ActivityLogger.log({
			actor: user._id.toString(),
			action: status === "approved" ? "claim_approved" : "claim_denied",
			target: "claim",
			targetId: claimId,
			metadata: { itemId: claim.itemId._id.toString(), status },
		});

		// Send notifications
		await NotificationService.notifyClaimResponse(
			claim.claimantId._id.toString(),
			claim.itemId.title,
			status === "approved" || status === "returned",
			claim.itemId._id.toString(),
			claimId
		);

		// Send email notification
		await EmailService.sendClaimResponse(
			claim.claimantId.email,
			status === "approved" || status === "returned",
			{
				claimantName: claim.claimantId.displayName,
				itemTitle: claim.itemId.title,
				responseMessage,
			}
		);

		// If returned, send return notification
		if (status === "returned") {
			await EmailService.sendReturnNotification(claim.claimantId.email, {
				claimantName: claim.claimantId.displayName,
				itemTitle: claim.itemId.title,
			});
		}

		return c.json(claim);
	} catch (error) {
		console.error("Respond to claim error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Get a specific claim
export async function getClaim(c: Context) {
	try {
		const user = c.get("user");
		const claimId = c.req.param("id");

		const claim = await Claim.findById(claimId)
			.populate("itemId", "title description images category location")
			.populate("claimantId", "displayName avatarUrl")
			.populate("reporterId", "displayName avatarUrl");

		if (!claim) {
			return c.json({ message: "Claim not found" }, 404);
		}

		// Check if user is involved in this claim or is admin
		if (
			claim.claimantId._id.toString() !== user._id.toString() &&
			claim.reporterId._id.toString() !== user._id.toString() &&
			user.role !== "admin"
		) {
			return c.json({ message: "Access denied" }, 403);
		}

		return c.json(claim);
	} catch (error) {
		console.error("Get claim error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}
