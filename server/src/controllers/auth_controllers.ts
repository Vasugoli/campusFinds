import { User } from "@/models/User.ts";
import { RefreshToken } from "@/models/RefreshToken.ts";
import { PasswordResetToken } from "@/models/PasswordResetToken.ts";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { EmailService } from "@/utils/emailService.ts";
import crypto from "crypto";

// Token expiration constants
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

// Simple validation helpers
function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

interface RegisterData {
	displayName?: string;
	email?: string;
	password?: string;
	rollNo?: string;
}

interface LoginData {
	email?: string;
	password?: string;
}

function validateRegisterData(data: RegisterData): string[] {
	const errors: string[] = [];

	if (!data.displayName || typeof data.displayName !== "string") {
		errors.push("Display name is required");
	}
	if (!data.email || !validateEmail(data.email)) {
		errors.push("Valid email is required");
	}
	if (!data.password || data.password.length < 6) {
		errors.push("Password must be at least 6 characters");
	}
	if (!data.rollNo || typeof data.rollNo !== "string") {
		errors.push("Roll number is required");
	}

	return errors;
}

function validateLoginData(data: LoginData): string[] {
	const errors: string[] = [];

	if (!data.email || !validateEmail(data.email)) {
		errors.push("Valid email is required");
	}
	if (!data.password) {
		errors.push("Password is required");
	}

	return errors;
}

// Generate tokens helper
async function generateTokens(userId: string): Promise<{
	accessToken: string;
	refreshToken: string;
}> {
	const secret = process.env.JWT_SECRET || "your-secret-key";

	// Access token with expiration
	const accessToken = jwt.sign({ id: userId }, secret, {
		expiresIn: ACCESS_TOKEN_EXPIRY,
	});

	// Generate refresh token
	const refreshTokenValue = crypto.randomBytes(32).toString("hex");

	// Store refresh token in database
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

	await RefreshToken.create({
		token: refreshTokenValue,
		userId,
		expiresAt,
	});

	return {
		accessToken,
		refreshToken: refreshTokenValue,
	};
}

// Register
export const registerUser = async (req: Request, res: Response) => {
	try {
		const body = req.body as RegisterData;
		const errors = validateRegisterData(body);

		if (errors.length > 0) {
			return res.status(400).json({ message: "Validation failed", errors });
		}

		const { displayName, email, password, rollNo } = body;

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(400).json({ message: "User already exists" });
		}

		const existingRoll = await User.findOne({ rollNo });
		if (existingRoll) {
			return res.status(400).json({ message: "Roll number already exists" });
		}

		const user = new User({ displayName, email, password, rollNo });
		await user.save();

		const { accessToken, refreshToken } = await generateTokens(
			String(user._id),
		);

		res.status(201).json({
			user: {
				id: user._id,
				displayName: user.displayName,
				email: user.email,
				rollNo: user.rollNo,
				role: user.role,
			},
			accessToken,
			refreshToken,
		});
	} catch (error) {
		console.error("Register error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Login
export const loginUser = async (req: Request, res: Response) => {
	try {
		const body = req.body as LoginData;
		const errors = validateLoginData(body);

		if (errors.length > 0) {
			return res.status(400).json({ message: "Validation failed", errors });
		}

		const { email, password } = body;

		const user = await User.findOne({ email });
		if (!user) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		// Check if user is banned
		if (user.isBanned) {
			return res.status(403).json({ message: "Account suspended" });
		}

		const isMatch = await user.comparePassword(password!);
		if (!isMatch) {
			return res.status(401).json({ message: "Invalid credentials" });
		}

		const { accessToken, refreshToken } = await generateTokens(
			String(user._id),
		);

		res.json({
			user: {
				id: user._id,
				displayName: user.displayName,
				email: user.email,
				rollNo: user.rollNo,
				role: user.role,
			},
			accessToken,
			refreshToken,
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Refresh Token
export const refreshAccessToken = async (req: Request, res: Response) => {
	try {
		const { refreshToken } = req.body as { refreshToken?: string };

		if (!refreshToken) {
			return res.status(400).json({ message: "Refresh token required" });
		}

		// Find the refresh token in database
		const storedToken = await RefreshToken.findOne({ token: refreshToken });

		if (!storedToken) {
			return res.status(401).json({ message: "Invalid refresh token" });
		}

		// Check if token is expired
		if (storedToken.expiresAt < new Date()) {
			await RefreshToken.deleteOne({ _id: storedToken._id });
			return res.status(401).json({ message: "Refresh token expired" });
		}

		// Get the user
		const user = await User.findById(storedToken.userId).select("-password");
		if (!user) {
			return res.status(401).json({ message: "User not found" });
		}

		// Check if user is banned
		if (user.isBanned) {
			await RefreshToken.deleteMany({ userId: user._id });
			return res.status(403).json({ message: "Account suspended" });
		}

		// Delete old refresh token and create new tokens
		await RefreshToken.deleteOne({ _id: storedToken._id });
		const tokens = await generateTokens(String(user._id));

		res.json({
			accessToken: tokens.accessToken,
			refreshToken: tokens.refreshToken,
		});
	} catch (error) {
		console.error("Refresh token error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Logout
export const logoutUser = async (req: Request, res: Response) => {
	try {
		const { refreshToken } = req.body as { refreshToken?: string };

		if (refreshToken) {
			await RefreshToken.deleteOne({ token: refreshToken });
		}

		res.json({ message: "Logged out successfully" });
	} catch (error) {
		console.error("Logout error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
	try {
		const { email } = req.body as { email?: string };

		if (!email || !validateEmail(email)) {
			return res.status(400).json({ message: "Valid email is required" });
		}

		// Always return success to prevent email enumeration
		const successMessage =
			"If an account with that email exists, a password reset link has been sent.";

		const user = await User.findOne({ email });
		if (!user) {
			// Don't reveal that user doesn't exist
			return res.json({ message: successMessage });
		}

		// Delete any existing reset tokens for this user
		await PasswordResetToken.deleteMany({ userId: user._id });

		// Generate new reset token
		const resetToken = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date();
		expiresAt.setHours(expiresAt.getHours() + PASSWORD_RESET_EXPIRY_HOURS);

		await PasswordResetToken.create({
			token: resetToken,
			userId: user._id,
			expiresAt,
		});

		// Send password reset email
		const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
		const resetLink = `${clientUrl}/reset-password?token=${resetToken}`;

		try {
			await EmailService.sendEmail({
				to: user.email,
				subject: "Reset Your CampusFinds Password",
				html: `
					<h2>Password Reset Request</h2>
					<p>Hi ${user.displayName},</p>
					<p>You requested to reset your password. Click the link below to set a new password:</p>
					<p><a href="${resetLink}">Reset Password</a></p>
					<p>This link will expire in 1 hour.</p>
					<p>If you didn't request this, please ignore this email.</p>
				`,
				text: `Hi ${user.displayName}, you requested to reset your password. Visit this link to reset: ${resetLink}. This link will expire in 1 hour.`,
			});
		} catch (emailError) {
			console.error("Failed to send password reset email:", emailError);
			// Log the reset token for development/testing
			console.log(`[DEV] Password reset token for ${email}: ${resetToken}`);
		}

		res.json({ message: successMessage });
	} catch (error) {
		console.error("Forgot password error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
	try {
		const { token, newPassword } = req.body as {
			token?: string;
			newPassword?: string;
		};

		if (!token) {
			return res.status(400).json({ message: "Reset token is required" });
		}

		if (!newPassword || newPassword.length < 6) {
			return res.status(400).json({ message: "Password must be at least 6 characters" });
		}

		// Find the reset token
		const resetToken = await PasswordResetToken.findOne({
			token,
			used: false,
		});

		if (!resetToken) {
			return res.status(400).json({ message: "Invalid or expired reset token" });
		}

		// Check if token is expired
		if (resetToken.expiresAt < new Date()) {
			await PasswordResetToken.deleteOne({ _id: resetToken._id });
			return res.status(400).json({ message: "Reset token has expired" });
		}

		// Find and update user password
		const user = await User.findById(resetToken.userId);
		if (!user) {
			return res.status(400).json({ message: "User not found" });
		}

		// Update password (will be hashed by pre-save hook)
		user.password = newPassword;
		await user.save();

		// Mark token as used and delete it
		await PasswordResetToken.deleteOne({ _id: resetToken._id });

		// Invalidate all refresh tokens for this user (security measure)
		await RefreshToken.deleteMany({ userId: user._id });

		res.json({ message: "Password reset successfully" });
	} catch (error) {
		console.error("Reset password error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get Me
export const getMe = (req: any, res: Response) => {
	const user = req.user;
	res.json(user);
};
