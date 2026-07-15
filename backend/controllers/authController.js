import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { checkAccountBackoff, recordFailedAttempt, clearFailedAttempts } from "../middleware/accountBackoff.js";
import { validateName, validateEmail, validatePassword } from "../utils/validators.js";
import { normalizeEmail } from "../utils/normalizeEmail.js";

export async function registerUser(req, res) {
  try {
    const { name, email, password } = req.body;

    const nameError = validateName(name);
    if (nameError) return res.status(400).json({ message: nameError });

    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ message: emailError });

    const passwordError = validatePassword(password, { name, email });
    if (passwordError) return res.status(400).json({ message: passwordError });

    const normalized = normalizeEmail(email);
    const existingUser = await User.findOne({ normalizedEmail: normalized });
    if (existingUser) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      normalizedEmail: normalized,
      password,
    });
    const token = generateToken(user._id);

    res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "An account with this email already exists" });
    }
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
}

export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      checkAccountBackoff(normalizedEmail);
    } catch (backoffErr) {
      res.set("Retry-After", Math.ceil(backoffErr.retryAfterMs / 1000).toString());
      return res.status(429).json({
        message: backoffErr.message,
        retryAfterSeconds: Math.ceil(backoffErr.retryAfterMs / 1000),
      });
    }

    const user = await User.findOne({ email: normalizedEmail });
    const passwordMatches = user ? await user.comparePassword(password) : false;

    if (!user || !passwordMatches) {
      recordFailedAttempt(normalizedEmail);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    clearFailedAttempts(normalizedEmail);
    const token = generateToken(user._id);
    res.status(200).json({ user, token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
}

export async function getMe(req, res) {
  res.status(200).json({ user: req.user });
}