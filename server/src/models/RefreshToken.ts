import mongoose from "mongoose";

interface IRefreshToken extends mongoose.Document {
	token: string;
	userId: mongoose.Types.ObjectId;
	expiresAt: Date;
	createdAt: Date;
}

const refreshTokenSchema = new mongoose.Schema<IRefreshToken>({
	token: { type: String, required: true, index: true },
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
		index: true,
	},
	expiresAt: { type: Date, required: true },
	createdAt: { type: Date, default: Date.now },
});

// TTL index - MongoDB will automatically delete expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = mongoose.model<IRefreshToken>(
	"RefreshToken",
	refreshTokenSchema
);
