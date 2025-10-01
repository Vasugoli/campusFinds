import { ActivityLog } from "../models/ActivityLog.ts";

interface LogActivityData {
	actor: string;
	action: string;
	target?: string;
	targetId?: string;
	metadata?: Record<string, unknown>;
}

export class ActivityLogger {
	static async log(data: LogActivityData): Promise<void> {
		try {
			const log = new ActivityLog({
				actor: data.actor,
				action: data.action,
				target: data.target,
				targetId: data.targetId,
				metadata: data.metadata,
			});
			await log.save();
		} catch (error) {
			console.error("Failed to log activity:", error);
		}
	}

	static async getUserActivity(userId: string, limit = 50) {
		try {
			return await ActivityLog.find({ actor: userId })
				.sort({ timestamp: -1 })
				.limit(limit)
				.populate("actor", "displayName email");
		} catch (error) {
			console.error("Failed to get user activity:", error);
			return [];
		}
	}

	static async getRecentActivity(limit = 100) {
		try {
			return await ActivityLog.find()
				.sort({ timestamp: -1 })
				.limit(limit)
				.populate("actor", "displayName email");
		} catch (error) {
			console.error("Failed to get recent activity:", error);
			return [];
		}
	}
}
