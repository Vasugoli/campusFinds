// Structured logging utility with request ID tracking and file logging
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	requestId: string;
	message: string;
	data?: Record<string, unknown>;
	error?: {
		message: string;
		stack?: string;
	};
}

class Logger {
	private logLevel: LogLevel = "info";
	private logsDir = path.resolve("./logs");
	private enableFileLogging = true;
	private errorReportingUrl?: string;

	constructor(logLevel: LogLevel = "info") {
		this.logLevel = logLevel;
		this.errorReportingUrl = process.env.ERROR_REPORTING_URL;
		this.initLogsDirectory();
	}

	private initLogsDirectory(): void {
		if (!this.enableFileLogging) return;

		try {
			if (!fs.existsSync(this.logsDir)) {
				fs.mkdirSync(this.logsDir, { recursive: true });
			}
		} catch (error) {
			console.warn("Could not create logs directory:", error);
			this.enableFileLogging = false;
		}
	}

	private shouldLog(level: LogLevel): boolean {
		const levels: Record<LogLevel, number> = {
			debug: 0,
			info: 1,
			warn: 2,
			error: 3,
		};
		return levels[level] >= levels[this.logLevel];
	}

	private formatConsoleLog(entry: LogEntry): string {
		const { timestamp, level, requestId, message, data, error } = entry;
		let logStr = `[${timestamp}] [${level.toUpperCase()}] [${requestId}] ${message}`;

		if (data && Object.keys(data).length > 0) {
			logStr += ` | data: ${JSON.stringify(data)}`;
		}

		if (error) {
			logStr += ` | error: ${error.message}`;
			if (error.stack) {
				logStr += `\n${error.stack}`;
			}
		}

		return logStr;
	}

	private getLogFileName(): string {
		const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
		return path.join(this.logsDir, `app-${date}.log`);
	}

	private writeToFile(entry: LogEntry): void {
		if (!this.enableFileLogging) return;

		try {
			const jsonLine = JSON.stringify(entry) + "\n";
			fs.appendFileSync(this.getLogFileName(), jsonLine);
		} catch (error) {
			console.warn("Failed to write log to file:", error);
		}
	}

	private async reportError(entry: LogEntry): Promise<void> {
		if (!this.errorReportingUrl || entry.level !== "error") return;

		try {
			await fetch(this.errorReportingUrl, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					timestamp: entry.timestamp,
					level: entry.level,
					message: entry.message,
					error: entry.error,
					requestId: entry.requestId,
					data: entry.data,
					environment: process.env.NODE_ENV || "development",
					service: "campusfinds-api",
				}),
			});
		} catch (error) {
			// Silently fail - don't let error reporting break the app
			console.warn("Failed to report error to external service:", error);
		}
	}

	generateRequestId(): string {
		return uuidv4();
	}

	private log(
		level: LogLevel,
		req: any | null,
		message: string,
		data?: Record<string, unknown>,
		error?: Error | null
	): void {
		if (!this.shouldLog(level)) return;

		const requestId = req?.requestId || "NO_REQUEST";
		const timestamp = new Date().toISOString();

		const entry: LogEntry = {
			timestamp,
			level,
			requestId,
			message,
			...(data && { data }),
		};

		if (error) {
			entry.error = {
				message: error.message,
				stack: error.stack,
			};
		}

		// Console output
		const formattedLog = this.formatConsoleLog(entry);
		if (level === "error") {
			console.error(formattedLog);
		} else if (level === "warn") {
			console.warn(formattedLog);
		} else {
			console.log(formattedLog);
		}

		// File output (sync append is usually fine for low volume, but in production consider a stream)
		this.writeToFile(entry);

		// Error reporting (async, non-blocking)
		if (level === "error") {
			this.reportError(entry);
		}
	}

	debug(
		req: any | null,
		message: string,
		data?: Record<string, unknown>
	): void {
		this.log("debug", req, message, data);
	}

	info(
		req: any | null,
		message: string,
		data?: Record<string, unknown>
	): void {
		this.log("info", req, message, data);
	}

	warn(
		req: any | null,
		message: string,
		data?: Record<string, unknown>
	): void {
		this.log("warn", req, message, data);
	}

	error(
		req: any | null,
		message: string,
		error?: Error,
		data?: Record<string, unknown>
	): void {
		this.log("error", req, message, data, error);
	}

	// Security-specific logging methods
	securityEvent(
		req: any | null,
		event: string,
		data?: Record<string, unknown>
	): void {
		this.log("warn", req, `[SECURITY] ${event}`, data);
	}

	authFailure(
		req: any | null,
		reason: string,
		data?: Record<string, unknown>
	): void {
		this.log("warn", req, `[AUTH_FAILURE] ${reason}`, data);
	}
}

// Global logger instance
let loggerInstance: Logger | null = null;

export function initLogger(logLevel: LogLevel = "info"): Logger {
	loggerInstance = new Logger(logLevel);
	return loggerInstance;
}

export function getLogger(): Logger {
	if (!loggerInstance) {
		loggerInstance = new Logger("info");
	}
	return loggerInstance;
}

// Middleware to add request ID to all requests
export const requestIdMiddleware = () => {
	return (req: any, res: Response, next: NextFunction) => {
		const logger = getLogger();
		req.requestId = logger.generateRequestId();

		// Log incoming request
		logger.info(req, `${req.method} ${req.originalUrl || req.url}`);

		next();
	};
};
