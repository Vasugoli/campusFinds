import { z } from "zod";

// Auth Schemas
export const RegisterSchema = z.object({
	displayName: z
		.string()
		.min(2, "Display name must be at least 2 characters")
		.max(100, "Display name must be at most 100 characters"),
	email: z.string().email("Invalid email address"),
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
		.regex(/[a-z]/, "Password must contain at least one lowercase letter")
		.regex(/[0-9]/, "Password must contain at least one number"),
	rollNo: z
		.string()
		.min(2, "Roll number is required")
		.max(20, "Roll number must be at most 20 characters"),
	phone: z.string().optional(),
});

export const LoginSchema = z.object({
	email: z.string().email("Invalid email address"),
	password: z.string().min(1, "Password is required"),
});

export const UpdateProfileSchema = z.object({
	displayName: z
		.string()
		.min(2, "Display name must be at least 2 characters")
		.max(100, "Display name must be at most 100 characters")
		.optional(),
	phone: z.string().optional(),
	avatarUrl: z.string().url("Invalid URL").optional(),
});

// Item Schemas
export const CreateItemSchema = z.object({
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(100, "Title must be at most 100 characters"),
	description: z
		.string()
		.min(10, "Description must be at least 10 characters")
		.max(2000, "Description must be at most 2000 characters"),
	category: z
		.string()
		.min(1, "Category is required")
		.max(50, "Category must be at most 50 characters"),
	location: z
		.string()
		.min(2, "Location is required")
		.max(200, "Location must be at most 200 characters"),
	images: z
		.array(
			z.object({
				url: z.string().url("Invalid image URL"),
				publicId: z.string(),
			})
		)
		.optional()
		.default([]),
	tags: z
		.array(z.string().max(30))
		.max(10, "Maximum 10 tags allowed")
		.optional()
		.default([]),
	status: z.enum(["lost", "found", "returned"]).optional().default("lost"),
});

export const UpdateItemSchema = z.object({
	title: z
		.string()
		.min(3, "Title must be at least 3 characters")
		.max(100, "Title must be at most 100 characters")
		.optional(),
	description: z
		.string()
		.min(10, "Description must be at least 10 characters")
		.max(2000, "Description must be at most 2000 characters")
		.optional(),
	category: z.string().max(50).optional(),
	location: z.string().min(2).max(200).optional(),
	status: z.enum(["lost", "found", "returned"]).optional(),
	tags: z.array(z.string().max(30)).max(10).optional(),
});

// Claim Schemas
export const CreateClaimSchema = z.object({
	itemId: z.string().min(1, "Item ID is required"),
	message: z
		.string()
		.min(10, "Message must be at least 10 characters")
		.max(1000, "Message must be at most 1000 characters")
		.optional(),
});

export const RespondToClaimSchema = z.object({
	status: z.enum(["approved", "denied", "returned"]),
	responseMessage: z
		.string()
		.max(1000, "Response message must be at most 1000 characters")
		.optional(),
});

// Report Schemas
export const CreateReportSchema = z.object({
	itemId: z.string().min(1, "Item ID is required"),
	reason: z
		.enum([
			"inappropriate",
			"duplicate",
			"misleading",
			"spam",
			"offensive",
			"other",
		])
		.default("other"),
	description: z
		.string()
		.min(10, "Description must be at least 10 characters")
		.max(1000, "Description must be at most 1000 characters")
		.optional(),
});

// Admin Schemas
export const BanUserSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
	reason: z
		.string()
		.min(5, "Ban reason must be at least 5 characters")
		.max(500, "Ban reason must be at most 500 characters"),
});

export const UpdateReportStatusSchema = z.object({
	status: z.enum(["open", "reviewed", "resolved"]),
	notes: z.string().optional(),
});

// Pagination
export const PaginationSchema = z.object({
	page: z
		.number()
		.int()
		.positive("Page must be a positive integer")
		.default(1),
	limit: z
		.number()
		.int()
		.positive("Limit must be a positive integer")
		.default(10),
});

// Helper function to validate request data
export function validateRequest<T>(schema: z.ZodSchema, data: unknown): T {
	const result = schema.safeParse(data);
	if (!result.success) {
		const errors = result.error.errors.map((err) => ({
			field: err.path.join("."),
			message: err.message,
		}));
		throw { status: 400, message: "Validation failed", errors };
	}
	return result.data as T;
}

// Type exports
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type CreateItemInput = z.infer<typeof CreateItemSchema>;
export type UpdateItemInput = z.infer<typeof UpdateItemSchema>;
export type CreateClaimInput = z.infer<typeof CreateClaimSchema>;
export type RespondToClaimInput = z.infer<typeof RespondToClaimSchema>;
export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type BanUserInput = z.infer<typeof BanUserSchema>;
