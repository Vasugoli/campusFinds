import mongoose from "mongoose";
import { genSalt, hash, compare } from "bcryptjs";

interface IUser extends mongoose.Document {
	displayName: string;
	email: string;
	password: string;
	avatarUrl?: string;
	rollNo: string;
	phone?: string;
	role: "user" | "admin";
	isBanned: boolean;
	createdAt: Date;
	comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>({
	displayName: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	avatarUrl: { type: String },
	rollNo: { type: String, required: true, unique: true },
	phone: { type: String },
	role: { type: String, enum: ["user", "admin"], default: "user" },
	isBanned: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	try {
		const salt = await genSalt(12);
		this.password = await hash(this.password, salt);
		next();
	} catch (error) {
		next(error as Error);
	}
});

// Compare password method
userSchema.methods.comparePassword = async function (
	candidatePassword: string
): Promise<boolean> {
	return await compare(candidatePassword, this.password);
};

// Indexes for efficient querying
userSchema.index({ email: 1 }); // For login lookups (unique constraint already exists)
userSchema.index({ rollNo: 1 }); // For roll number lookups
userSchema.index({ role: 1 }); // For admin queries
userSchema.index({ isBanned: 1, role: 1 }); // For filtering active users by role
userSchema.index({ createdAt: -1 }); // For recent users

export const User = mongoose.model<IUser>("User", userSchema);
