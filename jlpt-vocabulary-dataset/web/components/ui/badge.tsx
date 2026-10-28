import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "outline" | "warning" | "muted" }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", variant === "default" && "bg-emerald-100 text-emerald-900", variant === "outline" && "border border-slate-300 text-slate-700", variant === "warning" && "bg-amber-100 text-amber-900", variant === "muted" && "bg-slate-100 text-slate-700", className)} {...props} />;
}
