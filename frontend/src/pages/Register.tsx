import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Loader2, ArrowRight, Check, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import {
  validateName,
  validateEmail,
  validatePassword,
  getPasswordChecks,
  getPasswordStrength,
  isCommonPassword,
} from "../utils/validation";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState<{ [k: string]: boolean }>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const nameError = touched.name ? validateName(name) : null;
  const emailError = touched.email ? validateEmail(email) : null;
  const passwordChecks = useMemo(() => getPasswordChecks(password), [password]);
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const commonPasswordWarning =
    touched.password && isCommonPassword(password)
      ? "This password is too common — choose something less predictable"
      : null;
  const confirmError =
    touched.confirmPassword && confirmPassword !== password ? "Passwords do not match" : null;

  const isFormValid =
    !validateName(name) &&
    !validateEmail(email) &&
    !validatePassword(password) &&
    !isCommonPassword(password) &&
    confirmPassword === password;

  function markAllTouched() {
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    markAllTouched();

    if (!isFormValid) {
      setError("Please fix the errors above before continuing");
      return;
    }

    setSubmitting(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start understanding websites in seconds">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
            Full name
          </label>
          <div className="relative">
            <User
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Ahmed Khan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              className={`w-full rounded-xl bg-white/5 border text-white placeholder:text-slate-500 pl-11 pr-4 py-3 outline-none transition-colors duration-200 ${
                nameError
                  ? "border-red-500/70 focus:border-red-500"
                  : "border-white/10 focus:border-brand-400"
              }`}
            />
          </div>
          {nameError && (
            <p role="alert" className="text-red-400 text-xs mt-1.5">
              {nameError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
            />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              className={`w-full rounded-xl bg-white/5 border text-white placeholder:text-slate-500 pl-11 pr-4 py-3 outline-none transition-colors duration-200 ${
                emailError
                  ? "border-red-500/70 focus:border-red-500"
                  : "border-white/10 focus:border-brand-400"
              }`}
            />
          </div>
          {emailError && (
            <p role="alert" className="text-red-400 text-xs mt-1.5">
              {emailError}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
            Password
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onFocus={() => setTouched((t) => ({ ...t, password: true }))}
          />

          {password.length > 0 && (
            <div className="mt-2.5">
              <div className="flex gap-1 h-1.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-colors duration-200 ${
                      i < strength.score
                        ? strength.label === "Strong"
                          ? "bg-emerald-500"
                          : strength.label === "Medium"
                          ? "bg-amber-500"
                          : "bg-red-500"
                        : "bg-white/10"
                    }`}
                  />
                ))}
              </div>
              <p
                className={`text-xs mt-1.5 font-medium ${
                  strength.label === "Strong"
                    ? "text-emerald-400"
                    : strength.label === "Medium"
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {strength.label} password
              </p>
            </div>
          )}

          {touched.password && (
            <ul className="mt-3 grid grid-cols-1 gap-1.5">
              {passwordChecks.map((check) => (
                <li
                  key={check.label}
                  className={`text-xs flex items-center gap-2 transition-colors duration-200 ${
                    check.passed ? "text-emerald-400" : "text-slate-500"
                  }`}
                >
                  <span
                    className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${
                      check.passed ? "bg-emerald-500/20" : "bg-white/5"
                    }`}
                  >
                    {check.passed ? <Check size={11} /> : <X size={11} className="text-slate-600" />}
                  </span>
                  {check.label}
                </li>
              ))}
            </ul>
          )}
          {commonPasswordWarning && (
            <p role="alert" className="text-amber-400 text-xs mt-2">
              {commonPasswordWarning}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
            Confirm password
          </label>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
            hasError={!!confirmError}
          />
          {confirmError && (
            <p role="alert" className="text-red-400 text-xs mt-1.5">
              {confirmError}
            </p>
          )}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            role="alert"
            className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
          >
            {error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-400 hover:to-accent-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl py-3 transition-all duration-200 cursor-pointer shadow-lg shadow-brand-500/20"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Creating account...
            </>
          ) : (
            <>
              Create Account
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="text-slate-400 text-sm mt-7 text-center">
        Already have an account?{" "}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}