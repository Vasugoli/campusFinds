import express from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./database.ts";
import { validateAndLoadConfig } from "./utils/envConfig.ts";

// Validate and load configuration
export const config = validateAndLoadConfig();

// Create Express app instance
const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
	cors({
		origin: config.allowedOrigins,
		credentials: true,
	})
);

// Connect to database
await connectDB(config.mongodbUri);

export default app;
