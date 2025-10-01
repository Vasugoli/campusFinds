import { z } from "zod";

// User validation schemas
export const registerSchema = z.object({
	displayName: z.string().min(1, "Display name is required").max(100),
	email: z.string().email("Valid email is required"),
	password: z.string().min(6, "Password must be at least 6 characters"),
	rollNo: z.string().min(1, "Roll number is required").max(50),
	phone: z.string().optional(),
});

export const loginSchema = z.object({
	email: z.string().email("Valid email is required"),
	password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
	displayName: z.string().min(1).max(100).optional(),
	phone: z.string().optional(),
	avatarUrl: z.string().url().optional(),
});

// Item validation schemas
export const createItemSchema = z.object({
	title: z.string().min(1, "Title is required").max(200),
	description: z.string().min(1, "Description is required").max(2000),
	category: z.string().min(1, "Category is required"),
	location: z.string().min(1, "Location is required").max(500),
	status: z.enum(["lost", "found"]).default("lost"),
	images: z
		.array(
			z.object({
				url: z.string().url(),
				publicId: z.string(),
			})
		)
		.optional(),
	tags: z.array(z.string()).optional(),
	visibility: z.enum(["public", "private"]).default("public"),
});

export const updateItemSchema = z.object({
	title: z.string().min(1).max(200).optional(),
	description: z.string().min(1).max(2000).optional(),
	category: z.string().min(1).optional(),
	location: z.string().min(1).max(500).optional(),
	status: z.enum(["lost", "found", "returned"]).optional(),
	images: z
		.array(
			z.object({
				url: z.string().url(),
				publicId: z.string(),
			})
		)
		.optional(),
	tags: z.array(z.string()).optional(),
	visibility: z.enum(["public", "private"]).optional(),
});

// Search and filter schemas
export const searchItemsSchema = z.object({
	page: z.string().regex(/^\d+$/).transform(Number).default("1"),
	limit: z.string().regex(/^\d+$/).transform(Number).default("10"),
	search: z.string().optional(),
	category: z.string().optional(),
	status: z.enum(["lost", "found", "returned"]).optional(),
	location: z.string().optional(),
	dateFrom: z.string().datetime().optional(),
	dateTo: z.string().datetime().optional(),
	sortBy: z.enum(["createdAt", "updatedAt", "title"]).default("createdAt"),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Claim validation schemas
export const createClaimSchema = z.object({
	itemId: z.string().min(1, "Item ID is required"),
	message: z.string().max(1000).optional(),
});

export const respondToClaimSchema = z.object({
	status: z.enum(["approved", "denied", "returned"]),
	responseMessage: z.string().max(1000).optional(),
});

// Report validation schemas
export const createReportSchema = z.object({
	itemId: z.string().min(1, "Item ID is required"),
	reason: z.enum([
		"inappropriate_content",
		"spam",
		"fake_listing",
		"harassment",
		"stolen_item",
		"other",
	]),
	description: z.string().max(1000).optional(),
});

export const reviewReportSchema = z.object({
	status: z.enum(["reviewed", "resolved"]),
	action: z
		.enum([
			"no_action",
			"hide_item",
			"delete_item",
			"warn_user",
			"ban_user",
		])
		.optional(),
	notes: z.string().max(1000).optional(),
});

// Admin validation schemas
export const updateUserRoleSchema = z.object({
	role: z.enum(["user", "admin"]),
});

export const banUserSchema = z.object({
	isBanned: z.boolean(),
	reason: z.string().max(500).optional(),
});

export const broadcastNotificationSchema = z.object({
	subject: z.string().min(1, "Subject is required").max(200),
	message: z.string().min(1, "Message is required").max(2000),
	recipients: z.enum(["all", "admins", "users"]).default("all"),
});

// File upload validation
export const uploadImageSchema = z.object({
	folder: z.string().default("campusfinds"),
	maxSize: z.number().default(5 * 1024 * 1024), // 5MB
	allowedFormats: z.array(z.string()).default(["jpg", "jpeg", "png", "webp"]),
});

// Export all schemas as a collection
export const schemas = {
	// Auth
	register: registerSchema,
	login: loginSchema,
	updateProfile: updateProfileSchema,

	// Items
	createItem: createItemSchema,
	updateItem: updateItemSchema,
	searchItems: searchItemsSchema,

	// Claims
	createClaim: createClaimSchema,
	respondToClaim: respondToClaimSchema,

	// Reports
	createReport: createReportSchema,
	reviewReport: reviewReportSchema,

	// Admin
	updateUserRole: updateUserRoleSchema,
	banUser: banUserSchema,
	broadcastNotification: broadcastNotificationSchema,

	// Upload
	uploadImage: uploadImageSchema,
};
