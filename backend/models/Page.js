import mongoose from "mongoose";

const pageSchema = new mongoose.Schema(
  {
    website: { type: mongoose.Schema.Types.ObjectId, ref: "Website", required: true, index: true },
    url: { type: String, required: true },
    title: { type: String, default: "" },
    rawHtml: { type: String, required: false }, // cleared after chunking to save storage
  },
  { timestamps: true }
);

pageSchema.index({ website: 1, url: 1 }, { unique: true });

export default mongoose.model("Page", pageSchema);