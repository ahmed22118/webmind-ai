const COMMON_PASSWORDS = [
  "password", "password1", "password123", "12345678", "123456789",
  "qwerty123", "letmein1", "welcome1", "admin123", "iloveyou1",
];

export function validateName(name) {
  if (typeof name !== "string") return "Full name is required";
  const trimmed = name.trim();
  if (!trimmed) return "Full name is required";
  if (trimmed.length < 2) return "Name must be at least 2 characters";
  if (trimmed.length > 60) return "Name must be under 60 characters";
  if (/\s{2,}/.test(name)) return "Name cannot contain double spaces";
  if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(trimmed)) {
    return "Name can only contain letters and single spaces (no numbers or symbols)";
  }
  return null;
}

export function validateEmail(email) {
  if (typeof email !== "string") return "Email is required";
  const trimmed = email.trim();
  if (!trimmed) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(trimmed)) return "Enter a valid email address";
  if (trimmed.length > 254) return "Email is too long";
  return null;
}

export function validatePassword(password, { name, email } = {}) {
  if (typeof password !== "string") return "Password is required";
  if (password.length < 8) return "Password must be at least 8 characters";
  if (password.length > 128) return "Password is too long (max 128 characters)";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must include a number";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must include a special character";
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    return "This password is too common — choose something less predictable";
  }

  const lowerPassword = password.toLowerCase();
  const emailLocalPart = email ? email.split("@")[0].toLowerCase() : "";
  if (name && lowerPassword.includes(name.trim().toLowerCase().split(" ")[0])) {
    return "Password cannot contain your name";
  }
  if (emailLocalPart && emailLocalPart.length >= 4 && lowerPassword.includes(emailLocalPart)) {
    return "Password cannot contain part of your email";
  }

  return null;
}