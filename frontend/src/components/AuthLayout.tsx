import { motion } from "framer-motion";
import { Globe, MessageSquareText, Map, Quote } from "lucide-react";
import Logo from "./Logo";
import type { ReactNode } from "react";

const features = [
  { icon: Globe, text: "Paste any website — docs, portals, blogs" },
  { icon: MessageSquareText, text: "Ask questions in plain language" },
  { icon: Map, text: "Get answers with source references" },
];

export default function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="min-h-dvh w-full flex bg-surface-950">
      <div className="hidden lg:flex lg:w-[46%] relative overflow-hidden bg-gradient-to-br from-surface-900 via-surface-950 to-surface-900 border-r border-white/5">
        <motion.div
          className="absolute -top-32 -left-20 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-accent-500/20 blur-3xl"
          animate={{ x: [0, -20, 0], y: [0, -30, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Logo size="md" />
          <div className="max-w-md">
            <h1 className="font-display text-4xl font-semibold text-white leading-tight tracking-tight mb-4">
              Understand any website. Instantly.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed mb-10">
              WebMind AI reads, indexes, and understands entire websites — so you can ask
              questions and get grounded answers instead of digging through pages.
            </p>
            <ul className="space-y-4">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-slate-300 text-sm">
                  <span className="h-9 w-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-brand-400" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-white/5 border border-white/10 p-4">
            <Quote size={18} className="text-brand-400 shrink-0 mt-0.5" />
            <p className="text-slate-400 text-sm leading-relaxed">
              "Instead of navigating through dozens of pages, get direct, context-aware
              answers — supported by references to the source."
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <Logo size="sm" />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <h2 className="font-display text-2xl font-semibold text-white mb-1.5">{title}</h2>
            <p className="text-slate-400 text-sm mb-8">{subtitle}</p>
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
}