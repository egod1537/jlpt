import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "outline" | "warning" | "muted" }) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", variant === "default" && "bg-app-accent-surface text-app-text", variant === "outline" && "border border-app-border text-app-muted", variant === "warning" && "bg-amber-950 text-app-warning", variant === "muted" && "bg-app-raised text-app-muted", className)} {...props} />;
}
