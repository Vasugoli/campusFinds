import mongoose from "mongoose";

interface IClaim extends mongoose.Document {
	itemId: mongoose.Types.ObjectId;
	claimantId: mongoose.Types.ObjectId;
	reporterId: mongoose.Types.ObjectId;
	message?: string;
	status: "pending" | "approved" | "denied" | "returned";
	responseMessage?: string;
	respondedAt?: Date;
	createdAt: Date;
}

const claimSchema = new mongoose.Schema<IClaim>({
	itemId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Item",
		required: true,
	},
	claimantId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	reporterId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	message: { type: String },
	status: {
		type: String,
		enum: ["pending", "approved", "denied", "returned"],
		default: "pending",
	},
	responseMessage: { type: String },
	respondedAt: { type: Date },
	createdAt: { type: Date, default: Date.now },
});

// Index for efficient querying
claimSchema.index({ itemId: 1 });
claimSchema.index({ claimantId: 1, status: 1 });
claimSchema.index({ reporterId: 1, status: 1 });
claimSchema.index({ createdAt: -1 });

export const Claim = mongoose.model<IClaim>("Claim", claimSchema);
