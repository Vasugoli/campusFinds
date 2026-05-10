import { Request, Response } from "express";
import { Item } from "@/models/Item.ts";

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
export const getAllItems = async (req: Request, res: Response) => {
	try {
		const page = parseInt((req.query.page as string) || "1");
		const limit = parseInt((req.query.limit as string) || "10");
		const skip = (page - 1) * limit;

		const query = { visibility: "public" };

		// Add search functionality
		const search = req.query.search as string;
		if (search) {
			(query as Record<string, unknown>).$text = { $search: search };
		}

		const items = await Item.find(query)
			.populate("reporterId", "displayName avatarUrl")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit);

		const total = await Item.countDocuments(query);

		res.json({
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
		res.status(500).json({ message: "Internal server error" });
	}
};

// Get a single item
export const getItem = async (req: Request, res: Response) => {
	try {
		const item = await Item.findById(req.params.id).populate(
			"reporterId",
			"displayName avatarUrl"
		);
		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}
		res.json(item);
	} catch (error) {
		console.error("Get item error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Create an item
export const createItem = async (req: any, res: Response) => {
	try {
		const user = req.user;
		const body = req.body;

		const errors = validateCreateItem(body);
		if (errors.length > 0) {
			return res.status(400).json({ message: "Validation failed", errors });
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

		res.status(201).json(item);
	} catch (error) {
		console.error("Create item error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Update an item
export const updateItem = async (req: any, res: Response) => {
	try {
		const user = req.user as { _id: string; role: string };
		const itemId = req.params.id;
		const body = req.body;

		const item = await Item.findById(itemId);
		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}

		if (
			item.reporterId.toString() !== user._id.toString() &&
			user.role !== "admin"
		) {
			return res.status(403).json({ message: "Forbidden" });
		}

		const { title, description, category, location, status, images, tags } =
			body;

		// Validate status change
		if (status && !["lost", "found", "returned"].includes(status)) {
			return res.status(400).json({ message: "Invalid status" });
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

		res.json(item);
	} catch (error) {
		console.error("Update item error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};

// Delete an item
export const deleteItem = async (req: any, res: Response) => {
	try {
		const user = req.user as { _id: string; role: string };
		const itemId = req.params.id;
		const item = await Item.findById(itemId);

		if (!item) {
			return res.status(404).json({ message: "Item not found" });
		}

		if (
			item.reporterId.toString() !== user._id.toString() &&
			user.role !== "admin"
		) {
			return res.status(403).json({ message: "Forbidden" });
		}

		await Item.findByIdAndDelete(itemId);

		res.json({ message: "Item deleted" });
	} catch (error) {
		console.error("Delete item error:", error);
		res.status(500).json({ message: "Internal server error" });
	}
};
