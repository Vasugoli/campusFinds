interface EmailConfig {
	to: string | string[];
	subject: string;
	text?: string;
	html?: string;
}

interface EmailTemplate {
	subject: string;
	html: string;
	text: string;
}

export interface SendEmailJobData {
	to: string | string[];
	subject: string;
	text?: string;
	html?: string;
}

export class EmailService {
	private static apiKey = process.env.SENDGRID_API_KEY;
	private static fromEmail =
		process.env.FROM_EMAIL || "noreply@campusfinds.com";
	private static clientUrl =
		process.env.CLIENT_URL || "http://localhost:5173";

	static async sendEmail(config: EmailConfig): Promise<boolean> {
		if (!this.apiKey) {
			console.warn("SendGrid API key not configured");
			return false;
		}

		try {
			const response = await fetch(
				"https://api.sendgrid.com/v3/mail/send",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${this.apiKey}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						from: { email: this.fromEmail },
						personalizations: [
							{
								to: Array.isArray(config.to)
									? config.to.map((email) => ({ email }))
									: [{ email: config.to }],
								subject: config.subject,
							},
						],
						content: [
							...(config.text
								? [{ type: "text/plain", value: config.text }]
								: []),
							...(config.html
								? [{ type: "text/html", value: config.html }]
								: []),
						],
					}),
				}
			);

			return response.ok;
		} catch (error) {
			console.error("Failed to send email:", error);
			throw error; // Re-throw for job queue retry
		}
	}

	static getTemplate(
		type: string,
		data: Record<string, unknown>
	): EmailTemplate {
		switch (type) {
			case "claim_received":
				return {
					subject: `New claim for your item: ${data.itemTitle}`,
					html: `
						<h2>Someone wants to claim your item</h2>
						<p>Hi ${data.reporterName},</p>
						<p><strong>${
							data.claimantName
						}</strong> has submitted a claim for your item: <strong>${
						data.itemTitle
					}</strong></p>
						${data.claimMessage ? `<p>Message: "${data.claimMessage}"</p>` : ""}
						<p><a href="${this.clientUrl}/items/${
						data.itemId
					}">View Item and Respond</a></p>
					`,
					text: `Hi ${data.reporterName}, ${
						data.claimantName
					} has submitted a claim for your item: ${data.itemTitle}. ${
						data.claimMessage
							? `Message: "${data.claimMessage}"`
							: ""
					} View and respond at: ${this.clientUrl}/items/${
						data.itemId
					}`,
				};

			case "claim_approved":
				return {
					subject: `Your claim has been approved!`,
					html: `
						<h2>Great news!</h2>
						<p>Hi ${data.claimantName},</p>
						<p>Your claim for <strong>${
							data.itemTitle
						}</strong> has been approved by the owner.</p>
						${
							data.responseMessage
								? `<p>Message from owner: "${data.responseMessage}"</p>`
								: ""
						}
						<p><a href="${this.clientUrl}/profile">View in your profile</a></p>
					`,
					text: `Hi ${data.claimantName}, your claim for ${
						data.itemTitle
					} has been approved! ${
						data.responseMessage
							? `Message: "${data.responseMessage}"`
							: ""
					} View details at: ${this.clientUrl}/profile`,
				};

			case "claim_denied":
				return {
					subject: `Claim update for ${data.itemTitle}`,
					html: `
						<h2>Claim Update</h2>
						<p>Hi ${data.claimantName},</p>
						<p>Your claim for <strong>${
							data.itemTitle
						}</strong> was not approved at this time.</p>
						${
							data.responseMessage
								? `<p>Message from owner: "${data.responseMessage}"</p>`
								: ""
						}
						<p><a href="${this.clientUrl}/lost-and-found">Continue browsing items</a></p>
					`,
					text: `Hi ${data.claimantName}, your claim for ${
						data.itemTitle
					} was not approved. ${
						data.responseMessage
							? `Message: "${data.responseMessage}"`
							: ""
					} Continue browsing at: ${this.clientUrl}/lost-and-found`,
				};

			case "item_returned":
				return {
					subject: `Item marked as returned: ${data.itemTitle}`,
					html: `
						<h2>Item Successfully Returned!</h2>
						<p>Hi ${data.claimantName},</p>
						<p>The item <strong>${data.itemTitle}</strong> has been marked as returned. We hope you're reunited with your item!</p>
						<p>Thank you for using CampusFinds!</p>
					`,
					text: `Hi ${data.claimantName}, the item ${data.itemTitle} has been marked as returned. Thank you for using CampusFinds!`,
				};

			case "admin_notification":
				return {
					subject: (data.subject as string) || "Admin Notification",
					html: `
						<h2>Admin Notification</h2>
						<p>${data.message}</p>
					`,
					text: data.message as string,
				};

			default:
				return {
					subject: "CampusFinds Notification",
					html: `<p>${
						data.message ||
						"You have a new notification from CampusFinds."
					}</p>`,
					text:
						(data.message as string) ||
						"You have a new notification from CampusFinds.",
				};
		}
	}

	// Convenience methods for common email types
	static async sendClaimNotification(
		reporterEmail: string,
		data: Record<string, unknown>
	): Promise<boolean> {
		const template = this.getTemplate("claim_received", data);
		return await this.sendEmail({
			to: reporterEmail,
			subject: template.subject,
			html: template.html,
			text: template.text,
		});
	}

	static async sendClaimResponse(
		claimantEmail: string,
		approved: boolean,
		data: Record<string, unknown>
	): Promise<boolean> {
		const templateType = approved ? "claim_approved" : "claim_denied";
		const template = this.getTemplate(templateType, data);
		return await this.sendEmail({
			to: claimantEmail,
			subject: template.subject,
			html: template.html,
			text: template.text,
		});
	}

	static async sendReturnNotification(
		claimantEmail: string,
		data: Record<string, unknown>
	): Promise<boolean> {
		const template = this.getTemplate("item_returned", data);
		return await this.sendEmail({
			to: claimantEmail,
			subject: template.subject,
			html: template.html,
			text: template.text,
		});
	}

	static async sendAdminBroadcast(
		emails: string[],
		subject: string,
		message: string
	): Promise<boolean> {
		const template = this.getTemplate("admin_notification", {
			subject,
			message,
		});
		return await this.sendEmail({
			to: emails,
			subject: template.subject,
			html: template.html,
			text: template.text,
		});
	}
}
