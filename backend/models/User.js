import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { normalizeEmail } from "../utils/normalizeEmail.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    normalizedEmail: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true, minlength: 6 },
  },
  { timestamps: true }
);

// Compute normalizedEmail automatically whenever email changes
userSchema.pre("save", function (next) {
  if (this.isModified("email")) {
    this.normalizedEmail = normalizeEmail(this.email);
  }
  next();
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare candidate password with hashed password
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Never return password in JSON responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("User", userSchema);