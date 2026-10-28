import type { ReactNode } from "react";

export function PageHeading({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
    <div>{eyebrow && <p className="mb-2 text-sm font-bold text-emerald-700">{eyebrow}</p>}<h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{title}</h1>{description && <p className="mt-3 max-w-3xl leading-7 text-slate-600">{description}</p>}</div>
    {actions && <div className="shrink-0">{actions}</div>}
  </div>;
}
