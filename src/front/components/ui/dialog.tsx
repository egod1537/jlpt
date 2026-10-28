"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogTitle = DialogPrimitive.Title;
export const DialogDescription = DialogPrimitive.Description;

export function DialogContent({ className, children, ...props }: DialogPrimitive.DialogContentProps) {
  return <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70" />
    <DialogPrimitive.Content className={cn("fixed inset-x-3 bottom-3 z-50 max-h-[90vh] overflow-y-auto rounded-2xl border border-app-border bg-app-surface p-5 text-app-text shadow-xl focus:outline-none sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2", className)} {...props}>
      {children}
      <DialogPrimitive.Close aria-label="닫기" className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-lg text-app-muted hover:bg-app-raised"><X aria-hidden="true" className="h-5 w-5" /></DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>;
}
