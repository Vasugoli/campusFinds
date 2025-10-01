import mongoose from "mongoose";

interface INotification extends mongoose.Document {
	userId: mongoose.Types.ObjectId;
	title: string;
	message: string;
	type: "claim" | "admin" | "general" | "report";
	relatedId?: mongoose.Types.ObjectId;
	relatedType?: "item" | "claim" | "report";
	isRead: boolean;
	createdAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>({
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
	},
	title: { type: String, required: true },
	message: { type: String, required: true },
	type: {
		type: String,
		enum: ["claim", "admin", "general", "report"],
		required: true,
	},
	relatedId: { type: mongoose.Schema.Types.ObjectId },
	relatedType: {
		type: String,
		enum: ["item", "claim", "report"],
	},
	isRead: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
});

// Index for efficient querying
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>(
	"Notification",
	notificationSchema
);
