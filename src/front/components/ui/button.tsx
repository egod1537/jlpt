import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", {
  variants: {
    variant: {
      default: "bg-emerald-700 text-white hover:bg-emerald-800",
      secondary: "bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
      outline: "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
      ghost: "text-slate-700 hover:bg-slate-100",
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
