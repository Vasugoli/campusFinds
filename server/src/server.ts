import { Hono } from "https://deno.land/x/hono@v3.12.9/mod.ts";
import { logger } from "https://deno.land/x/hono@v3.12.9/middleware.ts";
import { mongoose } from "npm:mongoose";
import { auth } from "./middleware/auth.ts";
import authRoutes from "./routes/auth.ts";
import itemRoutes from "./routes/items.ts";

const app = new Hono().basePath("/api/v1");

// Middleware
app.use("*", logger());

// Connect to MongoDB
mongoose.connect(Deno.env.get("MONGO_URI")!)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// Routes
app.get("/", (c) => c.text("CampusFinds API"));

app.route("/auth", authRoutes);
app.route("/items", itemRoutes);


// Protected route example
app.get("/protected", auth, (c) => {
  const user = c.get("user");
  return c.json({ message: "This is a protected route", user });
});

const port = Deno.env.get("PORT") || 3000;
Deno.serve({ port }, app.fetch);
