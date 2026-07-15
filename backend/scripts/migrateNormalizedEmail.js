import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import { normalizeEmail } from "../utils/normalizeEmail.js";

dotenv.config();

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  const users = await User.find({ normalizedEmail: { $exists: false } });
  console.log(`Found ${users.length} users missing normalizedEmail`);

  for (const user of users) {
    user.normalizedEmail = normalizeEmail(user.email);
    await user.save({ validateBeforeSave: false });
    console.log(`Fixed: ${user.email} -> ${user.normalizedEmail}`);
  }

  console.log("Migration complete");
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});