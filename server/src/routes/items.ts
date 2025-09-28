import { Hono } from "https://deno.land/x/hono@v3.12.9/mod.ts";
import { auth } from "../../middleware/auth.ts";
import { Item } from "../../models/Item.ts";
import { zValidator } from '@hono/zod-validator';
import { z } from 'https://deno.land/x/zod/mod.ts';

const itemRoutes = new Hono();

const createItemSchema = z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    location: z.string(),
    images: z.array(z.object({
        url: z.string(),
        publicId: z.string(),
    })).optional(),
    tags: z.array(z.string()).optional(),
});

const updateItemSchema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    location: z.string().optional(),
    status: z.enum(["lost", "found", "returned"]).optional(),
    images: z.array(z.object({
        url: z.string(),
        publicId: z.string(),
    })).optional(),
    tags: z.array(z.string()).optional(),
});


// Get all items (public)
itemRoutes.get("/", async (c) => {
    const items = await Item.find({ visibility: "public" }).populate("reporterId", "displayName avatarUrl");
    return c.json(items);
});

// Get a single item
itemRoutes.get("/:id", async (c) => {
    const item = await Item.findById(c.req.param("id")).populate("reporterId", "displayName avatarUrl");
    if (!item) {
        return c.json({ message: "Item not found" }, 404);
    }
    return c.json(item);
});


// Create an item
itemRoutes.post("/", auth, zValidator('json', createItemSchema), async (c) => {
    const user = c.get("user");
    const { title, description, category, location, images, tags } = c.req.valid("json");

    const item = new Item({
        title,
        description,
        category,
        location,
        images,
        tags,
        reporterId: user._id,
    });

    await item.save();

    return c.json(item, 201);
});


// Update an item
itemRoutes.put("/:id", auth, zValidator('json', updateItemSchema), async (c) => {
    const user = c.get("user");
    const item = await Item.findById(c.req.param("id"));

    if (!item) {
        return c.json({ message: "Item not found" }, 404);
    }

    if (item.reporterId.toString() !== user._id.toString() && user.role !== 'admin') {
        return c.json({ message: "Forbidden" }, 403);
    }

    const { title, description, category, location, status, images, tags } = c.req.valid("json");

    item.title = title || item.title;
    item.description = description || item.description;
    item.category = category || item.category;
    item.location = location || item.location;
    item.status = status || item.status;
    item.images = images || item.images;
    item.tags = tags || item.tags;
    item.updatedAt = new Date();

    await item.save();

    return c.json(item);
});


// Delete an item
itemRoutes.delete("/:id", auth, async (c) => {
    const user = c.get("user");
    const item = await Item.findById(c.req.param("id"));

    if (!item) {
        return c.json({ message: "Item not found" }, 404);
    }

    if (item.reporterId.toString() !== user._id.toString() && user.role !== 'admin') {
        return c.json({ message: "Forbidden" }, 403);
    }

    await item.remove();

    return c.json({ message: "Item deleted" });
});

export default itemRoutes;
