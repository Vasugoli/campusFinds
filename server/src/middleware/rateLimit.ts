import { Request, Response, NextFunction } from "express";

interface RateLimitOptions {
	windowMs: number; // Time window in milliseconds
	maxRequests: number; // Maximum requests per window
	message?: string;
	skipSuccessfulRequests?: boolean;
	skipFailedRequests?: boolean;
}

interface RequestRecord {
	count: number;
	resetTime: number;
}

class MemoryStore {
	private requests = new Map<string, RequestRecord>();

	increment(
		key: string,
		windowMs: number
	): { count: number; resetTime: number } {
		const now = Date.now();
		const record = this.requests.get(key);

		if (!record || now > record.resetTime) {
			// New window or expired window
			const newRecord = { count: 1, resetTime: now + windowMs };
			this.requests.set(key, newRecord);
			return newRecord;
		}

		// Increment existing record
		record.count++;
		this.requests.set(key, record);
		return record;
	}

	cleanup(): void {
		const now = Date.now();
		for (const [key, record] of this.requests.entries()) {
			if (now > record.resetTime) {
				this.requests.delete(key);
			}
		}
	}
}

const store = new MemoryStore();

// Cleanup expired records every 5 minutes
setInterval(() => store.cleanup(), 5 * 60 * 1000);

export function rateLimit(options: RateLimitOptions) {
	const {
		windowMs,
		maxRequests,
		message = "Too many requests, please try again later.",
		skipSuccessfulRequests = false,
		skipFailedRequests = false,
	} = options;

	return (req: any, res: Response, next: NextFunction) => {
		// Get client identifier (IP address or user ID if authenticated)
		const clientId = getClientId(req);

		// Get current request count
		const { count, resetTime } = store.increment(clientId, windowMs);

		// Set rate limit headers
		res.set("X-RateLimit-Limit", maxRequests.toString());
		res.set(
			"X-RateLimit-Remaining",
			Math.max(0, maxRequests - count).toString()
		);
		res.set("X-RateLimit-Reset", new Date(resetTime).toISOString());

		// Check if limit exceeded
		if (count > maxRequests) {
			return res.status(429).json(
				{
					message,
					retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
				}
			);
		}

		// Save status of original send function to check skip options later
		const originalSend = res.send;
		res.send = function (body) {
			const statusCode = res.statusCode;
			if (skipSuccessfulRequests && statusCode < 400) {
				const record = store.increment(clientId, windowMs);
				record.count = Math.max(0, record.count - 2); // -1 from current req, -1 from increment here
			}
			if (skipFailedRequests && statusCode >= 400) {
				const record = store.increment(clientId, windowMs);
				record.count = Math.max(0, record.count - 2);
			}
			return originalSend.call(this, body);
		};

		// Continue to next middleware
		next();
	};
}

function getClientId(req: any): string {
	// Try to get user ID if authenticated
	const user = req.user;
	if (user?.id) {
		return `user:${user.id}`;
	}

	// Fallback to IP address
	const forwarded = req.headers["x-forwarded-for"];
	const ip = forwarded
		? (forwarded as string).split(",")[0]
		: req.socket.remoteAddress || "unknown";

	return `ip:${ip}`;
}

// Predefined rate limiters for common use cases
export const authRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	maxRequests: 5, // 5 auth attempts per 15 minutes
	message: "Too many authentication attempts, please try again later.",
});

export const generalRateLimit = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	maxRequests: 100, // 100 requests per 15 minutes
});

export const strictRateLimit = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	maxRequests: 10, // 10 requests per minute
});

export const uploadRateLimit = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	maxRequests: 5, // 5 uploads per minute
	message: "Too many file uploads, please wait before uploading again.",
});
