import { Request, Response } from "express";
import { Claim } from "@/models/Claim.ts";
import { Item } from "@/models/Item.ts";
import { ActivityLogger } from "@/utils/activityLogger.ts";
import { NotificationService } from "@/utils/notificationService.ts";
import { EmailService } from "@/utils/emailService.ts";

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
export const createClaim = async (req: any, res: Response) => {
	try {
		const user = req.user;
		const body = req.body;

		const errors = validateClaimData(body);
		if (errors.length > 0) {
			return res.status(400).json({ message: "Validation failed", errors });
		}

		const { itemId, message } = body;

		// Check if item exists and is claimable
		const item = await Item.findById(itemId).populate(
			"reporterId",
			"displayName email"
		);
		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}

		if (item.status === "returned") {
			return res.status(400).json(
				{ message: "This item has already been returned" }
			);
		}

		if ((item.reporterId as any)._id.toString() === user._id.toString()) {
			return res.status(400).json({ message: "You cannot claim your own item" });
		}

		// Check if user has already claimed this item
		const existingClaim = await Claim.findOne({
			itemId,
			claimantId: user._id,
			status: { $in: ["pending", "approved"] },
		});

		if (existingClaim) {
			return res.status(400).json(
				{ message: "You have already claimed this item" }
			);
		}

		// Create the claim
		const claim = new Claim({
			itemId,
			claimantId: user._id,
			reporterId: (item.reporterId as any)._id,
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
			(item.reporterId as any)._id.toString(),
			item.title,
			user.displayName,
			itemId,
			claim._id.toString()
		);

		// Send email notification
		await EmailService.sendClaimNotification((item.reporterId as any).email, {
			reporterName: (item.reporterId as any).displayName,
			claimantName: user.displayName,
			itemTitle: item.title,
			itemId,
			claimMessage: message,
		});

		res.status(201).json(claim);
	} catch (error) {
		console.error("Create claim error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get user's claims (as claimant)
export const getMyClaims = async (req: any, res: Response) => {
	try {
		const user = req.user;
		const page = parseInt((req.query.page as string) || "1");
		const limit = parseInt((req.query.limit as string) || "10");
		const skip = (page - 1) * limit;

		const claims = await Claim.find({ claimantId: user._id })
			.populate("itemId", "title description images category location")
			.populate("reporterId", "displayName avatarUrl")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const total = await Claim.countDocuments({ claimantId: user._id });

		res.json({
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
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get claims for user's items (as reporter)
export const getReceivedClaims = async (req: any, res: Response) => {
	try {
		const user = req.user;
		const page = parseInt((req.query.page as string) || "1");
		const limit = parseInt((req.query.limit as string) || "10");
		const skip = (page - 1) * limit;

		const claims = await Claim.find({ reporterId: user._id })
			.populate("itemId", "title description images category location")
			.populate("claimantId", "displayName avatarUrl")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const total = await Claim.countDocuments({ reporterId: user._id });

		res.json({
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
		res.status(500).json({ message: "Internal server error" });
	}
};

// Respond to a claim
export const respondToClaim = async (req: any, res: Response) => {
	try {
		const user = req.user;
		const claimId = req.params.id;
		const body = req.body;

		const errors = validateClaimResponse(body);
		if (errors.length > 0) {
			return res.status(400).json({ message: "Validation failed", errors });
		}

		const { status, responseMessage } = body;

		const claim = await Claim.findById(claimId)
			.populate("itemId", "title")
			.populate("claimantId", "displayName email")
			.populate("reporterId", "displayName");

		if (!claim) {
			return res.status(404).json({ message: "Claim not found" });
		}

		if ((claim.reporterId as any)._id.toString() !== user._id.toString()) {
			return res.status(403).json(
				{ message: "You can only respond to claims for your items" }
			);
		}

		if (claim.status !== "pending") {
			return res.status(400).json(
				{ message: "This claim has already been responded to" }
			);
		}

		// Update claim
		claim.status = status as any;
		claim.responseMessage = responseMessage;
		claim.respondedAt = new Date();
		await claim.save();

		// Update item status if approved or returned
		if (status === "approved") {
			await Item.findByIdAndUpdate((claim.itemId as any)._id, {
				claimedBy: (claim.claimantId as any)._id,
			});
		} else if (status === "returned") {
			await Item.findByIdAndUpdate((claim.itemId as any)._id, {
				status: "returned",
				claimedBy: (claim.claimantId as any)._id,
			});
		}

		// Log activity
		await ActivityLogger.log({
			actor: user._id.toString(),
			action: status === "approved" ? "claim_approved" : "claim_denied",
			target: "claim",
			targetId: claimId,
			metadata: { itemId: (claim.itemId as any)._id.toString(), status },
		});

		// Send notifications
		await NotificationService.notifyClaimResponse(
			(claim.claimantId as any)._id.toString(),
			(claim.itemId as any).title,
			status === "approved" || status === "returned",
			(claim.itemId as any)._id.toString(),
			claimId
		);

		// Send email notification
		await EmailService.sendClaimResponse(
			(claim.claimantId as any).email,
			status === "approved" || status === "returned",
			{
				claimantName: (claim.claimantId as any).displayName,
				itemTitle: (claim.itemId as any).title,
				responseMessage,
			}
		);

		// If returned, send return notification
		if (status === "returned") {
			await EmailService.sendReturnNotification((claim.claimantId as any).email, {
				claimantName: (claim.claimantId as any).displayName,
				itemTitle: (claim.itemId as any).title,
			});
		}

		res.json(claim);
	} catch (error) {
		console.error("Respond to claim error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get a specific claim
export const getClaim = async (req: any, res: Response) => {
	try {
		const user = req.user;
		const claimId = req.params.id;

		const claim = await Claim.findById(claimId)
			.populate("itemId", "title description images category location")
			.populate("claimantId", "displayName avatarUrl")
			.populate("reporterId", "displayName avatarUrl");

		if (!claim) {
			return res.status(404).json({ message: "Claim not found" });
		}

		// Check if user is involved in this claim or is admin
		if (
			(claim.claimantId as any)._id.toString() !== user._id.toString() &&
			(claim.reporterId as any)._id.toString() !== user._id.toString() &&
			user.role !== "admin"
		) {
			return res.status(403).json({ message: "Access denied" });
		}

		res.json(claim);
	} catch (error) {
		console.error("Get claim error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
