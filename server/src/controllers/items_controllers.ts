import { Context } from "hono";
import { Item } from "../models/Item.ts";

// Validation helpers
function validateCreateItem(data: Record<string, unknown>) {
	const errors: string[] = [];

	if (!data.title || typeof data.title !== "string") {
		errors.push("Title is required");
	}
	if (!data.description || typeof data.description !== "string") {
		errors.push("Description is required");
	}
	if (!data.category || typeof data.category !== "string") {
		errors.push("Category is required");
	}
	if (!data.location || typeof data.location !== "string") {
		errors.push("Location is required");
	}

	return errors;
}

// Get all items (public)
export async function getAllItems(c: Context) {
	try {
		const page = parseInt(c.req.query("page") || "1");
		const limit = parseInt(c.req.query("limit") || "10");
		const skip = (page - 1) * limit;

		const query = { visibility: "public" };

		// Add search functionality
		const search = c.req.query("search");
		if (search) {
			(query as Record<string, unknown>).$text = { $search: search };
		}

		const items = await Item.find(query)
			.populate("reporterId", "displayName avatarUrl")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const total = await Item.countDocuments(query);

		return c.json({
			items,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Get items error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Get a single item
export async function getItem(c: Context) {
	try {
		const item = await Item.findById(c.req.param("id")).populate(
			"reporterId",
			"displayName avatarUrl"
		);
		if (!item) {
			return c.json({ message: "Item not found" }, 404);
		}
		return c.json(item);
	} catch (error) {
		console.error("Get item error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Create an item
export async function createItem(c: Context) {
	try {
		const user = c.get("user");
		const body = await c.req.json();

		const errors = validateCreateItem(body);
		if (errors.length > 0) {
			return c.json({ message: "Validation failed", errors }, 400);
		}

		const { title, description, category, location, images, tags } = body;

		const item = new Item({
			title,
			description,
			category,
			location,
			images: images || [],
			tags: tags || [],
			reporterId: user._id,
			searchKeywords: [
				title,
				description,
				category,
				location,
				...(tags || []),
			],
		});

		await item.save();
		await item.populate("reporterId", "displayName avatarUrl");

		return c.json(item, 201);
	} catch (error) {
		console.error("Create item error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Update an item
export async function updateItem(c: Context) {
	try {
		const user = c.get("user") as { _id: string; role: string };
		const itemId = c.req.param("id");
		const body = await c.req.json();

		const item = await Item.findById(itemId);
		if (!item) {
			return c.json({ message: "Item not found" }, 404);
		}

		if (
			item.reporterId.toString() !== user._id.toString() &&
			user.role !== "admin"
		) {
			return c.json({ message: "Forbidden" }, 403);
		}

		const { title, description, category, location, status, images, tags } =
			body;

		// Validate status change
		if (status && !["lost", "found", "returned"].includes(status)) {
			return c.json({ message: "Invalid status" }, 400);
		}

		item.title = title || item.title;
		item.description = description || item.description;
		item.category = category || item.category;
		item.location = location || item.location;
		item.status = status || item.status;
		item.images = images || item.images;
		item.tags = tags || item.tags;
		item.searchKeywords = [
			item.title,
			item.description,
			item.category,
			item.location,
			...(item.tags || []),
		];
		item.updatedAt = new Date();

		await item.save();
		await item.populate("reporterId", "displayName avatarUrl");

		return c.json(item);
	} catch (error) {
		console.error("Update item error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}

// Delete an item
export async function deleteItem(c: Context) {
	try {
		const user = c.get("user") as { _id: string; role: string };
		const item = await Item.findById(c.req.param("id"));

		if (!item) {
			return c.json({ message: "Item not found" }, 404);
		}

		if (
			item.reporterId.toString() !== user._id.toString() &&
			user.role !== "admin"
		) {
			return c.json({ message: "Forbidden" }, 403);
		}

		await Item.findByIdAndDelete(c.req.param("id"));

		return c.json({ message: "Item deleted" });
	} catch (error) {
		console.error("Delete item error:", error);
		return c.json({ message: "Internal server error" }, 500);
	}
}
