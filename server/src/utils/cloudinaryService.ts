// Cloudinary configuration and upload utilities

interface CloudinaryConfig {
	cloud_name: string;
	api_key: string;
	api_secret: string;
}

interface UploadResult {
	public_id: string;
	secure_url: string;
	width: number;
	height: number;
	format: string;
	bytes: number;
}

export class CloudinaryService {
	private static config: CloudinaryConfig = {
		cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
		api_key: process.env.CLOUDINARY_API_KEY || "",
		api_secret: process.env.CLOUDINARY_API_SECRET || "",
	};

	static isConfigured(): boolean {
		return !!(
			this.config.cloud_name &&
			this.config.api_key &&
			this.config.api_secret
		);
	}

	static generateSignature(
		params: Record<string, string | number>,
		secret: string
	): string {
		// Sort parameters and create signature string
		const sortedParams = Object.keys(params)
			.filter((key) => key !== "signature")
			.sort()
			.map((key) => `${key}=${params[key]}`)
			.join("&");

		// In a real implementation, you'd use crypto to generate the signature
		// This is a simplified version - in production, use the cloudinary SDK
		return `${sortedParams}${secret}`;
	}

	static getUploadUrl(): string {
		return `https://api.cloudinary.com/v1_1/${this.config.cloud_name}/image/upload`;
	}

	static async uploadImage(
		file: File | Blob,
		folder = "campusfinds",
		publicId?: string
	): Promise<UploadResult | null> {
		if (!this.isConfigured()) {
			console.error("Cloudinary not configured");
			return null;
		}

		try {
			const formData = new FormData();
			formData.append("file", file);
			formData.append("upload_preset", "campusfinds_preset"); // You'll need to create this in Cloudinary
			formData.append("folder", folder);

			if (publicId) {
				formData.append("public_id", publicId);
			}

			const response = await fetch(this.getUploadUrl(), {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				throw new Error(`Upload failed: ${response.statusText}`);
			}

			const result = await response.json();
			return {
				public_id: result.public_id,
				secure_url: result.secure_url,
				width: result.width,
				height: result.height,
				format: result.format,
				bytes: result.bytes,
			};
		} catch (error) {
			console.error("Cloudinary upload error:", error);
			return null;
		}
	}

	static async deleteImage(publicId: string): Promise<boolean> {
		if (!this.isConfigured()) {
			console.error("Cloudinary not configured");
			return false;
		}

		try {
			const timestamp = Math.round(Date.now() / 1000);
			const params = {
				public_id: publicId,
				timestamp,
				api_key: this.config.api_key,
			};

			// In production, use proper signature generation
			const signature = this.generateSignature(
				params,
				this.config.api_secret
			);

			const formData = new FormData();
			formData.append("public_id", publicId);
			formData.append("timestamp", timestamp.toString());
			formData.append("api_key", this.config.api_key);
			formData.append("signature", signature);

			const response = await fetch(
				`https://api.cloudinary.com/v1_1/${this.config.cloud_name}/image/destroy`,
				{
					method: "POST",
					body: formData,
				}
			);

			const result = await response.json();
			return result.result === "ok";
		} catch (error) {
			console.error("Cloudinary delete error:", error);
			return false;
		}
	}

	static getOptimizedUrl(
		publicId: string,
		options: {
			width?: number;
			height?: number;
			crop?: string;
			quality?: string | number;
			format?: string;
		} = {}
	): string {
		const transformations: string[] = [];

		if (options.width) transformations.push(`w_${options.width}`);
		if (options.height) transformations.push(`h_${options.height}`);
		if (options.crop) transformations.push(`c_${options.crop}`);
		if (options.quality) transformations.push(`q_${options.quality}`);
		if (options.format) transformations.push(`f_${options.format}`);

		const transformString =
			transformations.length > 0 ? `${transformations.join(",")}/` : "";

		return `https://res.cloudinary.com/${this.config.cloud_name}/image/upload/${transformString}${publicId}`;
	}

	// Generate different image sizes for responsive design
	static getImageVariants(publicId: string) {
		return {
			thumbnail: this.getOptimizedUrl(publicId, {
				width: 150,
				height: 150,
				crop: "fill",
				quality: "auto",
			}),
			small: this.getOptimizedUrl(publicId, {
				width: 300,
				quality: "auto",
			}),
			medium: this.getOptimizedUrl(publicId, {
				width: 600,
				quality: "auto",
			}),
			large: this.getOptimizedUrl(publicId, {
				width: 1200,
				quality: "auto",
			}),
			original: this.getOptimizedUrl(publicId, { quality: "auto" }),
		};
	}
}
