import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String, required: true },
	category: { type: String, required: true },
	status: {
		type: String,
		enum: ["lost", "found", "returned"],
		default: "lost",
	},
	images: [{ url: String, publicId: String }],
	location: { type: String, required: true },
	reporterId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
	visibility: {
		type: String,
		enum: ["public", "private"],
		default: "public",
	},
	tags: [String],
	searchKeywords: [String],
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now },
});

itemSchema.index({
	title: "text",
	description: "text",
	tags: "text",
	searchKeywords: "text",
});

// Performance indexes for common queries
itemSchema.index({ status: 1, category: 1, createdAt: -1 }); // Filtered listing
itemSchema.index({ reporterId: 1, createdAt: -1 }); // User's items
itemSchema.index({ createdAt: -1 }); // Recent items
itemSchema.index({ visibility: 1, status: 1 }); // Public item filtering
itemSchema.index({ claimedBy: 1 }); // Claims lookup

export const Item = mongoose.model("Item", itemSchema);
