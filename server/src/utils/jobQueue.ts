// Simple async job queue for background tasks like sending emails

export interface Job<T = unknown> {
	id: string;
	type: string;
	data: T;
	status: "pending" | "processing" | "completed" | "failed";
	createdAt: Date;
	attempts: number;
	maxAttempts: number;
	error?: string;
}

export interface JobHandler<T = unknown> {
	(job: Job<T>): Promise<void>;
}

export interface QueueConfig {
	maxAttempts?: number;
	processingInterval?: number; // milliseconds
	maxConcurrent?: number;
}

class JobQueue {
	private jobs: Map<string, Job> = new Map();
	private handlers: Map<string, JobHandler> = new Map();
	private config: Required<QueueConfig>;
	private processing = false;
	private processingCount = 0;

	constructor(config: QueueConfig = {}) {
		this.config = {
			maxAttempts: config.maxAttempts || 3,
			processingInterval: config.processingInterval || 5000,
			maxConcurrent: config.maxConcurrent || 2,
		};

		// Start processing jobs periodically
		this.startProcessing();
	}

	/**
	 * Generate a simple unique ID
	 */
	private generateId(): string {
		return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Register a job handler for a specific job type
	 */
	registerHandler<T>(jobType: string, handler: JobHandler<T>): void {
		this.handlers.set(jobType, handler as JobHandler);
		console.log(`📋 Job handler registered: ${jobType}`);
	}

	/**
	 * Enqueue a new job
	 */
	enqueue<T>(jobType: string, data: T): Job<T> {
		if (!this.handlers.has(jobType)) {
			throw new Error(
				`No handler registered for job type: ${jobType}. Register a handler first.`
			);
		}

		const job: Job<T> = {
			id: this.generateId(),
			type: jobType,
			data,
			status: "pending",
			createdAt: new Date(),
			attempts: 0,
			maxAttempts: this.config.maxAttempts,
		};

		this.jobs.set(job.id, job);
		console.log(
			`✅ Job enqueued: ${jobType} (ID: ${job.id}). Queue size: ${this.jobs.size}`
		);

		return job;
	}

	/**
	 * Get all pending jobs
	 */
	getPendingJobs(): Job[] {
		return Array.from(this.jobs.values()).filter(
			(job) => job.status === "pending"
		);
	}

	/**
	 * Get job by ID
	 */
	getJob(jobId: string): Job | undefined {
		return this.jobs.get(jobId);
	}

	/**
	 * Process a single job
	 */
	private async processJob(job: Job): Promise<void> {
		const handler = this.handlers.get(job.type);

		if (!handler) {
			job.status = "failed";
			job.error = `No handler registered for job type: ${job.type}`;
			console.error(`❌ ${job.error}`);
			return;
		}

		try {
			job.status = "processing";
			job.attempts++;
			console.log(`⚙️  Processing job: ${job.type} (ID: ${job.id})`);

			await handler(job);

			job.status = "completed";
			console.log(
				`✅ Job completed: ${job.type} (ID: ${job.id}) after ${job.attempts} attempt(s)`
			);

			// Keep completed jobs for 1 hour then remove
			setTimeout(() => this.jobs.delete(job.id), 60 * 60 * 1000);
		} catch (error) {
			const errorMsg =
				error instanceof Error ? error.message : String(error);
			console.error(
				`❌ Job failed: ${job.type} (ID: ${job.id})`,
				errorMsg
			);

			job.error = errorMsg;

			if (job.attempts < job.maxAttempts) {
				job.status = "pending";
				console.log(
					`🔄 Retrying job: ${job.type} (Attempt ${job.attempts}/${job.maxAttempts})`
				);
			} else {
				job.status = "failed";
				console.error(
					`❌ Job failed permanently: ${job.type} (Max attempts reached)`
				);
			}
		}
	}

	/**
	 * Start processing jobs periodically
	 */
	private startProcessing(): void {
		setInterval(() => {
			if (this.processing) return;

			this.processing = true;

			Promise.resolve().then(async () => {
				const pendingJobs = this.getPendingJobs();

				for (const job of pendingJobs) {
					// Don't exceed max concurrent jobs
					if (this.processingCount >= this.config.maxConcurrent) {
						break;
					}

					this.processingCount++;

					try {
						await this.processJob(job);
					} finally {
						this.processingCount--;
					}
				}

				this.processing = false;
			});
		}, this.config.processingInterval);
	}

	/**
	 * Get queue statistics
	 */
	getStats() {
		const all = Array.from(this.jobs.values());
		return {
			total: all.length,
			pending: all.filter((j) => j.status === "pending").length,
			processing: all.filter((j) => j.status === "processing").length,
			completed: all.filter((j) => j.status === "completed").length,
			failed: all.filter((j) => j.status === "failed").length,
		};
	}

	/**
	 * Clear all jobs
	 */
	clear(): void {
		this.jobs.clear();
		console.log("🗑️  Job queue cleared");
	}

	/**
	 * Stop processing jobs
	 */
	stop(): void {
		this.processing = false;
		console.log("⏹️  Job queue processing stopped");
	}
}

// Export singleton instance
export const jobQueue = new JobQueue({
	maxAttempts: 3,
	processingInterval: 5000,
	maxConcurrent: 2,
});

export type { JobQueue };
