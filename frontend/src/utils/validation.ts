export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Full name is required";
  if (trimmed.length < 2) return "Name must be at least 2 characters";
  if (trimmed.length > 60) return "Name must be under 60 characters";
  if (/\s{2,}/.test(name)) return "Name cannot contain double spaces";
  if (name !== trimmed) return "Name cannot start or end with a space";
  if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(name)) {
    return "Name can only contain letters and single spaces (no numbers or symbols)";
  }
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(trimmed)) return "Enter a valid email address";
  return null;
}

export interface PasswordCheck {
  label: string;
  passed: boolean;
}

export function getPasswordChecks(password: string): PasswordCheck[] {
  return [
    { label: "At least 8 characters", passed: password.length >= 8 },
    { label: "One uppercase letter (A-Z)", passed: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a-z)", passed: /[a-z]/.test(password) },
    { label: "One number (0-9)", passed: /[0-9]/.test(password) },
    { label: "One special character (!@#$...)", passed: /[^A-Za-z0-9]/.test(password) },
  ];
}

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  const checks = getPasswordChecks(password);
  const score = checks.filter((c) => c.passed).length;

  if (password.length === 0) return { score: 0, label: "", color: "bg-slate-700" };
  if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 4) return { score, label: "Medium", color: "bg-yellow-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

export function validatePassword(password: string): string | null {
  const checks = getPasswordChecks(password);
  const failed = checks.find((c) => !c.passed);
  if (failed) return "Password does not meet all requirements below";
  if (password.length > 128) return "Password is too long (max 128 characters)";
  return null;
}

const COMMON_PASSWORDS = [
  "password", "password1", "password123", "12345678", "123456789",
  "qwerty123", "letmein1", "welcome1", "admin123", "iloveyou1",
];

export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.includes(password.toLowerCase());
}