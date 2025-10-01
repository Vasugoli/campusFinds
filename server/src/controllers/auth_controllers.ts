import { User } from "../models/User.ts";
import { create } from "djwt";
import { Context } from "hono";

// Helper function to create JWT key
async function getJWTKey(): Promise<CryptoKey> {
	const secret = Deno.env.get("JWT_SECRET") || "your-secret-key";
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	return await crypto.subtle.importKey(
		"raw",
		keyData,
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"]
	);
}

// Simple validation helpers
function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

function validateRegisterData(data: any) {
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

function validateLoginData(data: any) {
	const errors: string[] = [];

	if (!data.email || !validateEmail(data.email)) {
		errors.push("Valid email is required");
	}
	if (!data.password) {
		errors.push("Password is required");
	}

	return errors;
}

// Register
export async function registerUser(c: Context) {
	try {
		const body = await c.req.json();
		const errors = validateRegisterData(body);

		if (errors.length > 0) {
			return c.json({ message: "Validation failed", errors }, 400);
		}

		const { displayName, email, password, rollNo } = body;

		const existingUser = await User.findOne({ email });
		if (existingUser) {
			return c.json({ message: "User already exists" }, 400);
		}

		const existingRoll = await User.findOne({ rollNo });
		if (existingRoll) {
			return c.json({ message: "Roll number already exists" }, 400);
		}

		const user = new User({ displayName, email, password, rollNo });
		await user.save();

		const key = await getJWTKey();
		const token = await create(
			{ alg: "HS256", typ: "JWT" },
			{ id: user._id },
			key
		);

		return c.json({ token });
	} catch (error) {
		console.error("Register error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Login
export async function loginUser(c: Context) {
	try {
		const body = await c.req.json();
		const errors = validateLoginData(body);

		if (errors.length > 0) {
			return c.json({ message: "Validation failed", errors }, 400);
		}

		const { email, password } = body;

		const user = await User.findOne({ email });
		if (!user) {
			return c.json({ message: "Invalid credentials" }, 401);
		}

		const isMatch = await user.comparePassword(password);
		if (!isMatch) {
			return c.json({ message: "Invalid credentials" }, 401);
		}

		const key = await getJWTKey();
		const token = await create(
			{ alg: "HS256", typ: "JWT" },
			{ id: user._id },
			key
		);

		return c.json({ token });
	} catch (error) {
		console.error("Login error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Get Me
export function getMe(c: Context) {
	const user = c.get("user");
	return c.json(user);
}
