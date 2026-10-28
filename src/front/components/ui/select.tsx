import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn("h-11 rounded-xl border border-app-border bg-app-raised px-3 text-sm text-app-text", className)} {...props} />;
}
