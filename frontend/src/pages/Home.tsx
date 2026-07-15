import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Globe,
  LogOut,
  Sparkles,
  MessageSquareText,
  Map,
  Link2,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import { createWebsite, getMyWebsites, type Website } from "../api/websites";

const upcomingFeatures = [
  { icon: MessageSquareText, title: "AI Chat", desc: "Ask questions in natural language and get grounded answers." },
  { icon: Map, title: "Visual Sitemap", desc: "See the structure of any site at a glance." },
  { icon: Link2, title: "Source References", desc: "Every answer links back to the exact page it came from." },
];

const statusStyles: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  crawling: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  pending: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  failed: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loadingWebsites, setLoadingWebsites] = useState(true);

  useEffect(() => {
    loadWebsites();
  }, []);

  async function loadWebsites() {
    try {
      const sites = await getMyWebsites();
      setWebsites(sites);
    } catch {
      // silently ignore — not critical if this list fails to load
    } finally {
      setLoadingWebsites(false);
    }
  }

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || analyzing) return;

    setAnalyzing(true);
    setError("");

    try {
      const website = await createWebsite(url.trim());
      navigate(`/website/${website._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to analyze this website");
      setAnalyzing(false);
    }
  }

  return (
    <div className="min-h-dvh bg-surface-950 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-[40rem] rounded-full bg-brand-500/20 blur-3xl" />

      <header className="relative z-10 border-b border-white/5 px-6 py-4 flex items-center justify-between backdrop-blur-sm">
        <Logo size="sm" />
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-slate-400">{user?.email}</span>
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-xs font-semibold">
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <button
            onClick={logout}
            aria-label="Log out"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors duration-150 cursor-pointer"
          >
            <LogOut size={17} />
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-3xl mx-auto px-6 pt-16 sm:pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-300 bg-brand-500/10 border border-brand-500/20 rounded-full px-3 py-1 mb-6">
            <Sparkles size={12} />
            Retrieval-Augmented Generation
          </span>

          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-white leading-tight tracking-tight mb-3">
            Understand any website.
            <br />
            <span className="bg-gradient-to-r from-brand-400 to-accent-400 bg-clip-text text-transparent">
              Instantly.
            </span>
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto mb-10">
            Paste a URL below. We'll crawl it, build a knowledge base, and let you ask it
            anything.
          </p>

          <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Globe
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
              />
              <input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={analyzing}
                className="w-full rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 pl-11 pr-4 py-3.5 outline-none focus:border-brand-400 transition-colors duration-200 disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={!url.trim() || analyzing}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-400 hover:to-accent-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium rounded-xl px-6 py-3.5 transition-all duration-200 cursor-pointer shadow-lg shadow-brand-500/20 whitespace-nowrap"
            >
              {analyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Analyze"
              )}
            </button>
          </form>

          {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
          {analyzing && (
            <p className="text-slate-500 text-xs mt-3">
              This can take up to a minute or two — we're crawling and indexing the site now.
            </p>
          )}
        </motion.div>

        {/* Previously analyzed websites */}
        {!loadingWebsites && websites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="mt-14"
          >
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              Your Websites
            </p>
            <div className="space-y-2">
              {websites.map((site) => (
                <button
                  key={site._id}
                  onClick={() => navigate(`/website/${site._id}`)}
                  disabled={site.status !== "completed"}
                  className="w-full flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] border border-white/10 hover:border-white/20 disabled:hover:border-white/10 disabled:cursor-not-allowed px-4 py-3 transition-colors duration-200 text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Globe size={16} className="text-slate-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-white text-sm font-medium truncate">{site.domain}</p>
                      <p className="text-slate-500 text-xs truncate">{site.rootUrl}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        statusStyles[site.status] || statusStyles.pending
                      }`}
                    >
                      {site.status}
                    </span>
                    {site.status === "completed" && (
                      <ArrowRight
                        size={14}
                        className="text-slate-600 group-hover:text-brand-400 transition-colors duration-150"
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming feature cards — only show when there's no history yet */}
        {!loadingWebsites && websites.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
            className="grid sm:grid-cols-3 gap-4 mt-16 text-left"
          >
            {upcomingFeatures.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl bg-white/[0.03] border border-white/10 p-5 hover:border-white/20 transition-colors duration-200"
              >
                <div className="h-10 w-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                  <Icon size={18} className="text-brand-400" />
                </div>
                <h3 className="text-white font-medium text-sm mb-1">{title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </motion.div>
        )}
      </main>
    </div>
  );
}