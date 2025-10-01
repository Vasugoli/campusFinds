import mongoose from "mongoose";

interface IReport extends mongoose.Document {
	itemId: mongoose.Types.ObjectId;
	reporterId: mongoose.Types.ObjectId;
	reason: string;
	description?: string;
	status: "open" | "reviewed" | "resolved";
	reviewedBy?: mongoose.Types.ObjectId;
	reviewedAt?: Date;
	createdAt: Date;
}

const reportSchema = new mongoose.Schema<IReport>({
	itemId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Item",
		required: true,
	},
	reporterId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	reason: {
		type: String,
		required: true,
		enum: [
			"inappropriate_content",
			"spam",
			"fake_listing",
			"harassment",
			"stolen_item",
			"other",
		],
	},
	description: { type: String },
	status: {
		type: String,
		enum: ["open", "reviewed", "resolved"],
		default: "open",
	},
	reviewedBy: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
	},
	reviewedAt: { type: Date },
	createdAt: { type: Date, default: Date.now },
});

// Index for efficient querying
reportSchema.index({ itemId: 1, status: 1 });
reportSchema.index({ reporterId: 1 });
reportSchema.index({ createdAt: -1 });

export const Report = mongoose.model<IReport>("Report", reportSchema);
