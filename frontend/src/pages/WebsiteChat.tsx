import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Send,
  Loader2,
  Trash2,
  Map as MapIcon,
  MessageSquareText,
  Globe,
} from "lucide-react";
import {
  getWebsiteById,
  askQuestion,
  getConversationHistory,
  clearConversationHistory,
  type Conversation,
  type Page,
  type Website,
} from "../api/websites";
import { useAuth } from "../context/AuthContext";
import ChatMessage from "../components/ChatMessage";

export default function WebsiteChat() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [website, setWebsite] = useState<Website | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showSitemap, setShowSitemap] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const [{ website, pages }, history] = await Promise.all([
          getWebsiteById(id!),
          getConversationHistory(id!),
        ]);
        setWebsite(website);
        setPages(pages);
        setConversations(history);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load website");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, asking]);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !id || asking) return;

    const currentQuestion = question.trim();
    setQuestion("");
    setAsking(true);
    setError("");

    try {
      const result = await askQuestion(id, currentQuestion);
      setConversations((prev) => [
        ...prev,
        {
          _id: crypto.randomUUID(),
          question: result.question,
          answer: result.answer,
          sources: result.sources,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to get an answer");
    } finally {
      setAsking(false);
    }
  }

  async function handleClearHistory() {
    if (!id) return;
    if (!window.confirm("Clear all conversation history for this website? This can't be undone.")) {
      return;
    }
    try {
      await clearConversationHistory(id);
      setConversations([]);
    } catch {
      setError("Failed to clear history");
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-surface-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-400" size={28} />
      </div>
    );
  }

  if (error && !website) {
    return (
      <div className="min-h-dvh bg-surface-950 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="text-brand-400 hover:text-brand-300 text-sm"
        >
          ← Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate("/")}
            aria-label="Back"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors duration-150 cursor-pointer shrink-0"
          >
            <ArrowLeft size={17} />
          </button>
          <div className="min-w-0">
            <p className="text-white font-medium text-sm truncate">{website?.domain}</p>
            <p className="text-slate-500 text-xs truncate">{website?.pagesCrawled} pages indexed</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSitemap((s) => !s)}
            className={`h-9 px-3 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors duration-150 cursor-pointer ${
              showSitemap
                ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                : "text-slate-400 hover:text-white hover:bg-white/10 border border-transparent"
            }`}
          >
            <MapIcon size={14} />
            <span className="hidden sm:inline">Sitemap</span>
          </button>
          <button
            onClick={handleClearHistory}
            aria-label="Clear history"
            className="h-9 w-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150 cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sitemap panel */}
        <AnimatePresence>
          {showSitemap && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="border-r border-white/5 overflow-y-auto shrink-0"
            >
              <div className="p-4 w-[280px]">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
                  Crawled Pages ({pages.length})
                </p>
                <ul className="space-y-1">
                  {pages.map((p) => (
                    <li key={p._id}>
                      
                   <a     href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 text-xs text-slate-400 hover:text-brand-300 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors duration-150"
                      >
                        <Globe size={12} className="mt-0.5 shrink-0" />
                        <span className="truncate">{p.title || p.url}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {conversations.length === 0 && (
                <div className="text-center py-16">
                  <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquareText size={20} className="text-brand-400" />
                  </div>
                  <p className="text-slate-400 text-sm">
                    Ask anything about <span className="text-white">{website?.domain}</span>
                  </p>
                </div>
              )}

              {conversations.map((c) => (
                <ChatMessage
                  key={c._id}
                  question={c.question}
                  answer={c.answer}
                  sources={c.sources}
                  userInitial={user?.name?.charAt(0).toUpperCase() ?? "?"}
                />
              ))}

              {asking && (
                <div className="flex items-center gap-2.5 text-slate-500 text-sm">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center shrink-0">
                    <Loader2 size={13} className="text-white animate-spin" />
                  </div>
                  Thinking...
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-white/5 px-4 sm:px-6 py-4 shrink-0">
            <form onSubmit={handleAsk} className="max-w-2xl mx-auto flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question about this website..."
                maxLength={1000}
                disabled={asking}
                className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 px-4 py-3 outline-none focus:border-brand-400 transition-colors duration-200 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!question.trim() || asking}
                aria-label="Send"
                className="h-[46px] w-[46px] flex items-center justify-center bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-400 hover:to-accent-400 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all duration-200 cursor-pointer shrink-0"
              >
                <Send size={17} />
              </button>
            </form>
            {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}