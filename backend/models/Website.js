import mongoose from "mongoose";

const websiteSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rootUrl: { type: String, required: true, trim: true },
    domain: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "crawling", "completed", "failed"],
      default: "pending",
    },
    pagesCrawled: { type: Number, default: 0 },
    chunksCreated: { type: Number, default: 0 },
    error: { type: String, default: null },
    crawledAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Website", websiteSchema);