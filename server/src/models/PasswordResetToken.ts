import mongoose from "mongoose";

interface IPasswordResetToken extends mongoose.Document {
	token: string;
	userId: mongoose.Types.ObjectId;
	expiresAt: Date;
	used: boolean;
	createdAt: Date;
}

const passwordResetTokenSchema = new mongoose.Schema<IPasswordResetToken>({
	token: { type: String, required: true, index: true },
	userId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User",
		required: true,
		index: true,
	},
	expiresAt: { type: Date, required: true },
	used: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
});

// TTL index - delete tokens after 2 hours (includes buffer time)
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordResetToken = mongoose.model<IPasswordResetToken>(
	"PasswordResetToken",
	passwordResetTokenSchema
);
