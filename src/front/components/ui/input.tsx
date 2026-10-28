import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("h-11 w-full rounded-xl border border-app-border bg-app-raised px-3 text-base text-app-text placeholder:text-app-muted", className)} {...props} />;
}
