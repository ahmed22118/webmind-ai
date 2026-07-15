import { Sparkles } from "lucide-react";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = { sm: "h-7 w-7", md: "h-9 w-9", lg: "h-12 w-12" }[size];
  const textSize = { sm: "text-base", md: "text-lg", lg: "text-2xl" }[size];

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${dims} rounded-xl bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center shadow-lg shadow-brand-500/30`}
      >
        <Sparkles className="text-white" size={size === "lg" ? 24 : size === "md" ? 18 : 14} strokeWidth={2.25} />
      </div>
      <span className={`font-display font-semibold text-white ${textSize} tracking-tight`}>
        WebMind <span className="text-brand-400">AI</span>
      </span>
    </div>
  );
}