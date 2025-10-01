import { Claim } from "../models/Claim.ts";
import { EmailService } from "../utils/emailService.ts";
import { Notification } from "../models/Notification.ts";
import { NotificationService } from "../utils/notificationService.ts";
import { ActivityLogger } from "../utils/activityLogger.ts";
import { ActivityLog } from "../models/ActivityLog.ts";
import { Report } from "../models/Report.ts";
import { User } from "../models/User.ts";
import { Item } from "../models/Item.ts";
export async function adminDashboard(c) {
  try {
    const [
      totalUsers,
      totalItems,
      totalClaims,
      totalReports,
      recentActivity,
      userStats,
      itemStats,
    ] = await Promise.all([
      User.countDocuments(),
      Item.countDocuments(),
      Claim.countDocuments(),
      Report.countDocuments(),
      ActivityLog.find()
        .sort({ timestamp: -1 })
        .limit(10)
        .populate("actor", "displayName"),
      User.aggregate([
        {
          $group: {
            _id: "$role",
            count: { $sum: 1 },
          },
        },
      ]),
      Item.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);
    const pendingReports = await Report.countDocuments({ status: "open" });
    const pendingClaims = await Claim.countDocuments({ status: "pending" });
    return c.json({
      totals: {
        users: totalUsers,
        items: totalItems,
        claims: totalClaims,
        reports: totalReports,
        pendingReports,
        pendingClaims,
      },
      userStats: userStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      itemStats: itemStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {}),
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
}
export async function getUsers(c) {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const search = c.req.query("search");
    const role = c.req.query("role");
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};
    if (search) {
      query.$or = [
        { displayName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { rollNo: { $regex: search, $options: "i" } },
      ];
    }
    if (role && ["user", "admin"].includes(role)) {
      query.role = role;
    }
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await User.countDocuments(query);
    return c.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
}
export async function updateUserRole(c) {
  try {
    const adminUser = c.get("user") as { _id: string; displayName: string };
    const userId = c.req.param("id");
    const { role } = await c.req.json();
    if (!["user", "admin"].includes(role)) {
      return c.json({ message: "Invalid role" }, 400);
    }
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true },
    ).select("-password");
    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }
    // Log activity
    await ActivityLogger.log({
      actor: adminUser._id,
      action: "role_changed",
      target: "user",
      targetId: userId,
      metadata: { newRole: role, oldRole: user.role },
    });
    // Notify user
    await NotificationService.notifyAdminAction(
      userId,
      "Role Updated",
      `Your role has been updated to ${role} by an administrator.`,
    );
    return c.json(user);
  } catch (error) {
    console.error("Update user role error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
}
export async function banUsers(c) {
  try {
    const adminUser = c.get("user") as { _id: string; displayName: string };
    const userId = c.req.param("id");
    const { isBanned, reason } = await c.req.json();
    const user = await User.findByIdAndUpdate(
      userId,
      { isBanned },
      { new: true },
    ).select("-password");
    if (!user) {
      return c.json({ message: "User not found" }, 404);
    }
    // Log activity
    await ActivityLogger.log({
      actor: adminUser._id,
      action: isBanned ? "user_banned" : "user_unbanned",
      target: "user",
      targetId: userId,
      metadata: { reason },
    });
    // Notify user
    const title = isBanned ? "Account Suspended" : "Account Restored";
    const message = isBanned
      ? `Your account has been suspended. ${reason ? `Reason: ${reason}` : ""}`
      : "Your account has been restored and you can now access the platform.";
    await NotificationService.notifyAdminAction(userId, title, message);
    return c.json(user);
  } catch (error) {
    console.error("Ban user error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
}
export async function getItems(c) {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "20");
    const status = c.req.query("status");
    const visibility = c.req.query("visibility");
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};
    if (status && ["lost", "found", "returned"].includes(status)) {
      query.status = status;
    }
    if (visibility && ["public", "private"].includes(visibility)) {
      query.visibility = visibility;
    }
    const items = await Item.find(query)
      .populate("reporterId", "displayName email")
      .populate("claimedBy", "displayName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Item.countDocuments(query);
    return c.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get admin items error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
}
export async function updateItemVisibility(c) {
  try {
    const adminUser = c.get("user") as { _id: string };
    const itemId = c.req.param("id");
    const { visibility } = await c.req.json();
    if (!["public", "private"].includes(visibility)) {
      return c.json({ message: "Invalid visibility" }, 400);
    }
    const item = await Item.findByIdAndUpdate(
      itemId,
      { visibility },
      { new: true },
    ).populate("reporterId", "displayName");
    if (!item) {
      return c.json({ message: "Item not found" }, 404);
    }
    // Log activity
    await ActivityLogger.log({
      actor: adminUser._id,
      action: "admin_action",
      target: "item",
      targetId: itemId,
      metadata: {
        action: visibility === "private" ? "hide_item" : "show_item",
      },
    });
    return c.json(item);
  } catch (error) {
    console.error("Update item visibility error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
}
export async function deleteItem(c) {
  try {
    const adminUser = c.get("user") as { _id: string };
    const itemId = c.req.param("id");
    const item = await Item.findById(itemId);
    if (!item) {
      return c.json({ message: "Item not found" }, 404);
    }
    await Item.findByIdAndDelete(itemId);
    // Log activity
    await ActivityLogger.log({
      actor: adminUser._id,
      action: "admin_action",
      target: "item",
      targetId: itemId,
      metadata: { action: "delete_item", itemTitle: item.title },
    });
    return c.json({ message: "Item deleted" });
  } catch (error) {
    console.error("Delete item error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
}
export async function exportData(c) {
  try {
    const type = c.req.param("type");
    const format = c.req.query("format") || "json";
    let data;
    switch (type) {
      case "users":
        data = await User.find().select("-password");
        break;
      case "items":
        data = await Item.find().populate("reporterId", "displayName email");
        break;
      case "reports":
        data = await Report.find()
          .populate("itemId", "title")
          .populate("reporterId", "displayName email");
        break;
      case "claims":
        data = await Claim.find()
          .populate("itemId", "title")
          .populate("claimantId", "displayName email")
          .populate("reporterId", "displayName email");
        break;
      default:
        return c.json({ message: "Invalid export type" }, 400);
    }
    if (format === "csv") {
      // Simple CSV conversion (in production, use a proper CSV library)
      const csvData = convertToCSV(data);
      c.header("Content-Type", "text/csv");
      c.header("Content-Disposition", `attachment; filename="${type}.csv"`);
      return c.text(csvData);
    }
    return c.json(data);
  } catch (error) {
    console.error("Export error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
}
function convertToCSV(data: unknown[]): string {
  if (!data.length) return "";
  const headers = Object.keys(data[0] as Record<string, unknown>);
  const csvHeaders = headers.join(",");
  const csvRows = data.map((row) => {
    const values = headers.map((header) => {
      const val = (row as Record<string, unknown>)[header];
      return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
    });
    return values.join(",");
  });
  return [csvHeaders, ...csvRows].join("\n");
}
export async function sendBroadcast(c) {
  try {
    const adminUser = c.get("user") as { _id: string; displayName: string };
    const { subject, message, recipients = "all" } = await c.req.json();
    if (!subject || !message) {
      return c.json({ message: "Subject and message are required" }, 400);
    }
    // Get recipient users
    const query: Record<string, unknown> = {};
    if (recipients === "admins") {
      query.role = "admin";
    } else if (recipients === "users") {
      query.role = "user";
    }
    const users = await User.find(query).select("_id email displayName");
    // Send notifications
    const notifications = users.map((user) => ({
      userId: user._id.toString(),
      title: subject,
      message,
      type: "admin" as const,
    }));
    // Create notifications in batches
    await Notification.insertMany(notifications);
    // Send emails
    const emails = users.map((user) => user.email);
    await EmailService.sendAdminBroadcast(emails, subject, message);
    // Log activity
    await ActivityLogger.log({
      actor: adminUser._id,
      action: "admin_action",
      target: "notification",
      metadata: {
        action: "broadcast",
        recipients: recipients,
        recipientCount: users.length,
        subject,
      },
    });
    return c.json({
      message: "Broadcast sent successfully",
      recipientCount: users.length,
    });
  } catch (error) {
    console.error("Broadcast error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
}
export async function getActivityLogs(c) {
  try {
    const page = parseInt(c.req.query("page") || "1");
    const limit = parseInt(c.req.query("limit") || "50");
    const action = c.req.query("action");
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};
    if (action) {
      query.action = action;
    }
    const logs = await ActivityLog.find(query)
      .populate("actor", "displayName email")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    const total = await ActivityLog.countDocuments(query);
    return c.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get activity logs error:", error);
    return c.json({ message: "Internal server error" }, 500);
  }
}
