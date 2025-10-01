import { Hono } from "hono";
import { cors, logger } from "hono/middleware";
import { connectDB } from "./database.ts";
// Create Hono app instance
const app = new Hono();
// Middleware
app.use("*", logger());
app.use(
	"*",
	cors({
		origin: ["http://localhost:5173", "http://localhost:3000"], // Frontend URLs
		credentials: true,
	}),
);
// Connect to database
await connectDB();
export default app;
