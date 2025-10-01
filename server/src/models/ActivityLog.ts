import mongoose from "mongoose";

interface IActivityLog extends mongoose.Document {
	actor: mongoose.Types.ObjectId;
	action: string;
	target?: string;
	targetId?: mongoose.Types.ObjectId;
	metadata?: Record<string, unknown>;
	timestamp: Date;
}

const activityLogSchema = new mongoose.Schema<IActivityLog>({
	actor: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	action: {
		type: String,
		required: true,
		enum: [
			"user_registered",
			"user_login",
			"item_created",
			"item_updated",
			"item_deleted",
			"item_claimed",
			"claim_approved",
			"claim_denied",
			"item_reported",
			"report_reviewed",
			"user_banned",
			"user_unbanned",
			"role_changed",
			"admin_action",
		],
	},
	target: { type: String }, // e.g., "user", "item", "report"
	targetId: { type: mongoose.Schema.Types.ObjectId },
	metadata: { type: mongoose.Schema.Types.Mixed },
	timestamp: { type: Date, default: Date.now },
});

// Index for efficient querying
activityLogSchema.index({ actor: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
activityLogSchema.index({ targetId: 1, timestamp: -1 });

export const ActivityLog = mongoose.model<IActivityLog>(
	"ActivityLog",
	activityLogSchema
);
