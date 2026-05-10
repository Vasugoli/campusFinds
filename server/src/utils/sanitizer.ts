// Input sanitization utility for XSS and injection prevention

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
	const htmlEscapeMap: Record<string, string> = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#x27;",
		"/": "&#x2F;",
	};

	return String(input).replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char]);
}

/**
 * Removes potentially dangerous characters and HTML tags
 */
export function stripHtmlTags(input: string): string {
	return String(input)
		.replace(/<[^>]*>/g, "") // Remove HTML tags
		.replace(/&[^;]+;/g, ""); // Remove HTML entities
}

/**
 * Sanitizes strings for safe database storage
 */
export function sanitizeString(input: unknown): string {
	if (typeof input !== "string") {
		return "";
	}

	// Remove null bytes
	let sanitized = input.replace(/\0/g, "");

	// Trim whitespace
	sanitized = sanitized.trim();

	// Remove control characters by checking character codes
	sanitized = Array.from(sanitized)
		.filter((char) => {
			const code = char.charCodeAt(0);
			return code > 31 && code !== 127;
		})
		.join("");

	return sanitized;
}

/**
 * Sanitizes object values recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
	const sanitized: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === "string") {
			sanitized[key] = sanitizeString(value);
		} else if (Array.isArray(value)) {
			sanitized[key] = value.map((item) =>
				typeof item === "string" ? sanitizeString(item) : item
			);
		} else if (value !== null && typeof value === "object") {
			sanitized[key] = sanitizeObject(value as Record<string, unknown>);
		} else {
			sanitized[key] = value;
		}
	}

	return sanitized as T;
}

/**
 * Validates and sanitizes email addresses
 */
export function sanitizeEmail(email: string): string {
	const sanitized = sanitizeString(email).toLowerCase();

	// Basic email format validation
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(sanitized)) {
		throw new Error("Invalid email format");
	}

	return sanitized;
}

/**
 * Validates and sanitizes URLs
 */
export function sanitizeUrl(url: string): string {
	const sanitized = sanitizeString(url);

	try {
		const urlObj = new URL(sanitized);
		// Only allow http and https protocols
		if (!["http:", "https:"].includes(urlObj.protocol)) {
			throw new Error("Invalid protocol");
		}
		return urlObj.toString();
	} catch {
		throw new Error("Invalid URL format");
	}
}

/**
 * Sanitizes and validates MongoDB ObjectId
 */
export function sanitizeObjectId(id: string): string {
	const sanitized = sanitizeString(id);

	// MongoDB ObjectId is 24 hex characters
	if (!/^[0-9a-fA-F]{24}$/.test(sanitized)) {
		throw new Error("Invalid Object ID format");
	}

	return sanitized;
}

/**
 * Escapes special characters in regex patterns
 */
export function escapeRegex(input: string): string {
	return String(input).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Prevents NoSQL injection by sanitizing object keys and values
 */
export function sanitizeForDatabase<T extends Record<string, unknown>>(
	obj: T
): T {
	const sanitized: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(obj)) {
		// Prevent key-based injection
		const cleanKey = key.replace(/^\$/, "").replace(/\./g, "_");

		if (typeof value === "string") {
			// Remove MongoDB operators
			const cleanValue = value.replace(/^\$/, "").replace(/^{.*}$/g, "");
			sanitized[cleanKey] = sanitizeString(cleanValue);
		} else if (Array.isArray(value)) {
			sanitized[cleanKey] = value.map((item) =>
				typeof item === "string"
					? sanitizeString(item.replace(/^\$/, ""))
					: item
			);
		} else if (value !== null && typeof value === "object") {
			sanitized[cleanKey] = sanitizeForDatabase(
				value as Record<string, unknown>
			);
		} else {
			sanitized[cleanKey] = value;
		}
	}

	return sanitized as T;
}
