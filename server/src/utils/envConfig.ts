import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Environment validation utility
export interface AppConfig {
	nodeEnv: "development" | "production" | "test";
	port: number;
	clientUrl: string;
	allowedOrigins: string[];
	mongodbUri: string;
	jwtSecret: string;
	cloudinary: {
		cloudName: string;
		apiKey: string;
		apiSecret: string;
	};
	sendgrid: {
		apiKey: string;
		fromEmail: string;
	};
	admin: {
		autoHideThreshold: number;
		autoBanThreshold: number;
	};
	logLevel: "debug" | "info" | "warn" | "error";
}

function getEnvString(key: string, defaultValue?: string): string {
	const value = process.env[key];
	if (!value && defaultValue === undefined) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value || defaultValue || "";
}

function getEnvNumber(key: string, defaultValue?: number): number {
	const value = process.env[key];
	if (!value && defaultValue === undefined) {
		throw new Error(`Missing required environment variable: ${key}`);
	}
	return value ? parseInt(value, 10) : defaultValue || 0;
}

function parseOrigins(originString: string): string[] {
	return originString
		.split(",")
		.map((origin) => origin.trim())
		.filter((origin) => origin.length > 0);
}

export function validateAndLoadConfig(): AppConfig {
	const nodeEnv = getEnvString("NODE_ENV", "development") as
		| "development"
		| "production"
		| "test";

	// Validate required environment variables
	const requiredEnvVars = [
		"MONGODB_URI",
		"JWT_SECRET",
		"CLOUDINARY_CLOUD_NAME",
		"CLOUDINARY_API_KEY",
		"CLOUDINARY_API_SECRET",
		"SENDGRID_API_KEY",
		"FROM_EMAIL",
		"CLIENT_URL",
		"ALLOWED_ORIGINS",
	];

	const missingVars: string[] = [];

	for (const envVar of requiredEnvVars) {
		if (!process.env[envVar]) {
			missingVars.push(envVar);
		}
	}

	if (missingVars.length > 0) {
		console.error(
			"❌ Missing required environment variables:",
			missingVars.join(", ")
		);
		console.error("📋 See .env.example for reference");
		process.exit(1);
	}

	// Validate JWT secret strength
	const jwtSecret = getEnvString("JWT_SECRET");
	if (
		jwtSecret ===
		"your-super-secret-jwt-key-change-in-production-min-32-chars"
	) {
		console.warn(
			"⚠️  WARNING: Using default JWT secret. Change JWT_SECRET in production!"
		);
		if (nodeEnv === "production") {
			throw new Error(
				"Production environment must have a secure JWT_SECRET set"
			);
		}
	}

	if (jwtSecret.length < 32) {
		throw new Error("JWT_SECRET must be at least 32 characters long");
	}

	const allowedOrigins = parseOrigins(getEnvString("ALLOWED_ORIGINS"));

	const config: AppConfig = {
		nodeEnv,
		port: getEnvNumber("PORT", 5000),
		clientUrl: getEnvString("CLIENT_URL"),
		allowedOrigins,
		mongodbUri: getEnvString("MONGODB_URI"),
		jwtSecret,
		cloudinary: {
			cloudName: getEnvString("CLOUDINARY_CLOUD_NAME"),
			apiKey: getEnvString("CLOUDINARY_API_KEY"),
			apiSecret: getEnvString("CLOUDINARY_API_SECRET"),
		},
		sendgrid: {
			apiKey: getEnvString("SENDGRID_API_KEY"),
			fromEmail: getEnvString("FROM_EMAIL"),
		},
		admin: {
			autoHideThreshold: getEnvNumber("AUTO_HIDE_THRESHOLD", 5),
			autoBanThreshold: getEnvNumber("AUTO_BAN_THRESHOLD", 10),
		},
		logLevel: getEnvString("LOG_LEVEL", "info") as
			| "debug"
			| "info"
			| "warn"
			| "error",
	};

	return config;
}
