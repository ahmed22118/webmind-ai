import { motion } from "framer-motion";
import { Link2, Sparkles, ArrowUpRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Source } from "../api/websites";

const markdownComponents = {
  p: ({ children }: any) => <p className="mb-2.5">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold text-white">{children}</strong>,
  a: ({ href, children }: any) => (
    
   <a   href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-brand-300 hover:text-brand-200 underline underline-offset-2 break-words"
    >
      {children}
    </a>
  ),
  ul: ({ children }: any) => (
    <ul className="list-disc list-outside pl-5 mb-2.5 space-y-1">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-outside pl-5 mb-2.5 space-y-1">{children}</ol>
  ),
  li: ({ children }: any) => <li className="pl-1">{children}</li>,
  code: ({ children }: any) => (
    <code className="bg-white/10 rounded px-1.5 py-0.5 text-xs font-mono text-brand-200">
      {children}
    </code>
  ),
  h1: ({ children }: any) => (
    <h4 className="font-display font-semibold text-white text-base mb-2 mt-1">{children}</h4>
  ),
  h2: ({ children }: any) => (
    <h4 className="font-display font-semibold text-white text-sm mb-2 mt-1">{children}</h4>
  ),
  h3: ({ children }: any) => <h4 className="font-medium text-white text-sm mb-1.5 mt-1">{children}</h4>,
};

export default function ChatMessage({
  question,
  answer,
  sources,
  userInitial,
}: {
  question: string;
  answer: string;
  sources: Source[];
  userInitial: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* User question */}
      <div className="flex items-start gap-2.5 justify-end">
        <div className="max-w-[80%] bg-brand-600/20 border border-brand-500/20 rounded-2xl rounded-tr-sm px-4 py-2.5">
          <p className="text-white text-sm whitespace-pre-wrap">{question}</p>
        </div>
        <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center text-xs text-slate-300 font-medium shrink-0 mt-0.5">
          {userInitial}
        </div>
      </div>

      {/* AI answer — bento grid layout */}
      <div className="flex items-start gap-2.5">
        <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={13} className="text-white" />
        </div>

        <div className="max-w-[85%] w-full space-y-2">
          {/* Summary tile — the main answer */}
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
            <div className="mb-2 pb-2 border-b border-white/[0.06]">
              <span className="text-[11px] font-medium bg-gradient-to-r from-brand-300 to-accent-300 bg-clip-text text-transparent">
                WebMind AI · Summary
              </span>
            </div>
            <div className="text-slate-200 text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {answer}
              </ReactMarkdown>
            </div>
          </div>

          {/* Bento grid of sources */}
          {sources.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 auto-rows-[92px] gap-2">
              {sources.map((s, i) => (
                <motion.a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25, delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className={`group relative flex flex-col justify-between rounded-xl border overflow-hidden p-3 transition-colors duration-200 ${
                    i === 0
                      ? "col-span-2 row-span-1 bg-gradient-to-br from-brand-500/15 to-accent-500/10 border-brand-500/25 hover:border-brand-400/40"
                      : "bg-white/[0.03] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div
                      className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${
                        i === 0 ? "bg-brand-400/20" : "bg-white/5"
                      }`}
                    >
                      <Link2 size={11} className="text-brand-300" />
                    </div>
                    <ArrowUpRight
                      size={13}
                      className="text-slate-600 group-hover:text-brand-300 transition-colors duration-150 shrink-0"
                    />
                  </div>
                  <p
                    className={`text-slate-300 group-hover:text-white transition-colors duration-150 leading-snug ${
                      i === 0 ? "text-xs font-medium line-clamp-2" : "text-[11px] line-clamp-2"
                    }`}
                  >
                    {s.title || s.url}
                  </p>
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}