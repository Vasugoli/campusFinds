import { Context, Next } from "hono";
import { verify } from "djwt";
import { User } from "../models/User.ts";

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

export const auth = async (c: Context, next: Next) => {
	const authHeader = c.req.header("Authorization");

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return c.json({ message: "Unauthorized" }, 401);
	}

	const token = authHeader.split(" ")[1];

	try {
		const key = await getJWTKey();
		const payload = await verify(token, key);
		const user = await User.findById(payload.id as string).select(
			"-password"
		);

		if (!user) {
			return c.json({ message: "Unauthorized" }, 401);
		}

		c.set("user", user);
		await next();
	} catch (error) {
		console.error("Auth error:", error);
		return c.json({ message: "Unauthorized" }, 401);
	}
};

export const admin = async (c: Context, next: Next) => {
	const user = c.get("user");

	if (!user || user.role !== "admin") {
		return c.json({ message: "Forbidden" }, 403);
	}

	await next();
};
