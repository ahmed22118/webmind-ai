import mongoose from "mongoose";

const sourceSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    title: { type: String, default: "" },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    website: { type: mongoose.Schema.Types.ObjectId, ref: "Website", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    sources: { type: [sourceSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);