import mongoose from "mongoose";

const chunkSchema = new mongoose.Schema(
  {
    website: { type: mongoose.Schema.Types.ObjectId, ref: "Website", required: true, index: true },
    page: { type: mongoose.Schema.Types.ObjectId, ref: "Page", required: true, index: true },
    pageUrl: { type: String, required: true },
    pageTitle: { type: String, default: "" },
    chunkIndex: { type: Number, required: true },
    content: { type: String, required: true },
    wordCount: { type: Number, required: true },
    // embedding gets added here on Day 4 — left out for now
  },
  { timestamps: true }
);

export default mongoose.model("Chunk", chunkSchema);