import { Hono } from "hono";
import { auth } from "../middleware/auth.ts";
import { getAllItems, getItem, createItem, updateItem, deleteItem } from "../controllers/items_controllers.ts";

const itemRoutes = new Hono();

// Get all items (public)
itemRoutes.get("/", getAllItems);

// Get a single item
itemRoutes.get("/:id", getItem);

// Create an item
itemRoutes.post("/", auth, createItem);

// Update an item
itemRoutes.put("/:id", auth, updateItem);

// Delete an item
itemRoutes.delete("/:id", auth, deleteItem);

export default itemRoutes;
