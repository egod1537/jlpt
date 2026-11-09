import type { GrammarSetType } from "@/lib/grammar";
import { cn } from "@/lib/utils";

type GrammarSetTypeIconProps = {
  type: GrammarSetType;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function GrammarSetTypeIcon({ type, size = "md", className }: GrammarSetTypeIconProps) {
  const sizeClass = size === "sm" ? "h-7 w-7 rounded-lg" : size === "lg" ? "h-14 w-14 rounded-2xl" : "h-11 w-11 rounded-xl";
  return <span aria-hidden="true" className={cn("inline-flex shrink-0 items-center justify-center border", sizeClass, type === "flashcard" ? "border-cyan-800 bg-cyan-950 text-app-accent" : "border-orange-900 bg-orange-950 text-app-meaning", className)}>
    {type === "flashcard" ? <svg viewBox="0 0 48 48" className={size === "sm" ? "h-4 w-4" : "h-7 w-7"} fill="none">
      <rect x="7" y="9" width="28" height="23" rx="4" stroke="currentColor" strokeWidth="2.5" opacity=".45" />
      <rect x="10" y="12" width="29" height="25" rx="4" fill="currentColor" opacity=".16" />
      <rect x="10" y="12" width="29" height="25" rx="4" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="17" cy="21" r="2.25" fill="currentColor" />
      <path d="M22 20h10M17 28h15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg> : <svg viewBox="0 0 48 48" className={size === "sm" ? "h-4 w-4" : "h-7 w-7"} fill="none">
      <path d="M6.5 11.5c6.8-1.4 12.6.1 17.5 4.4v24c-4.9-4.3-10.7-5.8-17.5-4.4v-24Z" fill="currentColor" opacity=".15" />
      <path d="M41.5 11.5c-6.8-1.4-12.6.1-17.5 4.4v24c4.9-4.3 10.7-5.8 17.5-4.4v-24Z" fill="currentColor" opacity=".22" />
      <path d="M6.5 11.5c6.8-1.4 12.6.1 17.5 4.4m0 0c4.9-4.3 10.7-5.8 17.5-4.4v24c-6.8-1.4-12.6.1-17.5 4.4m0-24v24m-12-18.5c3.7-.2 6.8.6 9.3 2.5m6.4 0c2.5-1.9 5.6-2.7 9.3-2.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>}
  </span>;
}
