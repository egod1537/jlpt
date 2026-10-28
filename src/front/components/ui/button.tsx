import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      default: "bg-app-accent-surface text-white hover:bg-app-accent",
      secondary: "bg-app-raised text-app-accent hover:bg-app-accent-surface",
      outline: "border border-app-border bg-app-surface text-app-text hover:bg-app-raised",
      ghost: "text-app-muted hover:bg-app-raised hover:text-app-text",
      destructive: "bg-red-700 text-white hover:bg-red-800",
    },
    size: { default: "h-11", sm: "min-h-11 px-3", lg: "min-h-12 px-6 text-base", icon: "h-11 w-11 px-0" },
  },
  defaultVariants: { variant: "default", size: "default" },
});

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean }

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
