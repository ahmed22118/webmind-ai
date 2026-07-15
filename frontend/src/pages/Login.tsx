import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/AuthLayout";
import PasswordInput from "../components/PasswordInput";
import { validateEmail } from "../utils/validation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<{ email?: boolean }>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const emailError = touched.email ? validateEmail(email) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setTouched({ email: true });

    if (validateEmail(email)) return;

    setSubmitting(true);
    try {
      await login(email.trim().toLowerCase(), password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to continue to WebMind AI">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
              Logging in...
            </>
          ) : (
            <>
              Log In
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>

      <p className="text-slate-400 text-sm mt-7 text-center">
        No account?{" "}
        <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}