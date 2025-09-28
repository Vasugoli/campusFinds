import { mongoose } from "npm:mongoose";

const itemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ["lost", "found", "returned"], default: "lost" },
  images: [{ url: String, publicId: String }],
  location: { type: String, required: true },
  reporterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  visibility: { type: String, enum: ["public", "private"], default: "public" },
  tags: [String],
  searchKeywords: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

itemSchema.index({ title: "text", description: "text", tags: "text", searchKeywords: "text" });

export const Item = mongoose.model("Item", itemSchema);
