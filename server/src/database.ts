import { connect } from "mongoose";

let isConnected = false;

export async function connectDB(mongoUri?: string): Promise<void> {
	if (isConnected) {
		console.log("📊 Already connected to MongoDB");
		return;
	}

	try {
		const MONGODB_URI =
			mongoUri ||
			process.env.MONGODB_URI ||
			"mongodb://localhost:27017/campusfinds";

		await connect(MONGODB_URI);

		isConnected = true;
		console.log("📊 Connected to MongoDB successfully");
	} catch (error) {
		console.error("❌ MongoDB connection error:", error);
		process.exit(1);
	}
}

export function getConnectionStatus(): boolean {
	return isConnected;
}
