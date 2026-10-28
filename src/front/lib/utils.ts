import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumber = (value: number) => new Intl.NumberFormat("ko-KR").format(value);
export const formatDate = (value: string) => new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(value));
export const formatDateTime = (value: string) => new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
