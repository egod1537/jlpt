import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("rounded-2xl border border-app-border bg-app-surface shadow-sm", className)} {...props} />; }
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("p-5 pb-2", className)} {...props} />; }
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) { return <h3 className={cn("text-lg font-bold text-app-text", className)} {...props} />; }
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) { return <p className={cn("mt-1 text-sm leading-6 text-app-muted", className)} {...props} />; }
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("p-5 pt-3", className)} {...props} />; }
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) { return <div className={cn("flex items-center p-5 pt-0", className)} {...props} />; }
