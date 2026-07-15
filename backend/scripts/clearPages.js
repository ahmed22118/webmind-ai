import mongoose from "mongoose";
import dotenv from "dotenv";
import Page from "../models/Page.js";

dotenv.config();

async function clearPages() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const result = await Page.deleteMany({});
  console.log(`Deleted ${result.deletedCount} page documents`);

  await mongoose.disconnect();
  console.log("Done");
}

clearPages().catch((err) => {
  console.error("Failed to clear pages:", err);
  process.exit(1);
});