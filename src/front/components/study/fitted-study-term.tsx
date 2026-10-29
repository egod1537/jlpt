"use client";

import { useLayoutEffect, useRef, type RefObject, type ReactNode } from "react";

function useFitText(slotRef: RefObject<HTMLElement | null>, textRef: RefObject<HTMLElement | null>, contentKey: string, maximum: number, isTerm = false) {
  useLayoutEffect(() => {
    const slot = slotRef.current;
    const text = textRef.current;
    if (!slot || !text) return;
    let disposed = false;

    const fit = () => {
      if (disposed || !slot.clientWidth || !slot.clientHeight) return;
      // Measure actual wrapping, including font metrics, instead of guessing by character count.
      const availableHeight = slot.clientHeight - (isTerm ? 8 : 2);
      let low = 1;
      let high = isTerm ? Math.min(64, Math.max(40, window.innerWidth * 0.13)) : maximum;
      const fits = (size: number) => {
        text.style.fontSize = `${size}px`;
        return Math.max(text.scrollHeight, text.getBoundingClientRect().height) <= availableHeight
          && text.scrollWidth <= slot.clientWidth;
      };
      if (fits(high)) return;
      while (high - low > 0.25) {
        const middle = (low + high) / 2;
        if (fits(middle)) low = middle;
        else high = middle;
      }
      text.style.fontSize = `${low}px`;
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(slot);
    window.addEventListener("resize", fit);
    document.fonts.addEventListener("loadingdone", fit);
    void document.fonts.ready.then(fit);
    return () => {
      disposed = true;
      observer.disconnect();
      window.removeEventListener("resize", fit);
      document.fonts.removeEventListener("loadingdone", fit);
    };
  }, [contentKey, maximum, isTerm, slotRef, textRef]);
}

export function FittedStudyDetails({ children, contentKey }: { children: ReactNode; contentKey: string }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  useFitText(slotRef, textRef, contentKey, 18);
  return <div ref={slotRef} className="study-details min-h-0 w-full max-w-md flex-1 overflow-hidden">
    <div ref={textRef} data-fitted-text className="flex w-full flex-col [overflow-wrap:anywhere]" style={{ fontSize: 18, lineHeight: 1.5, gap: "1.5em" }}>{children}</div>
  </div>;
}

export function FittedStudyTerm({ term }: { term: string }) {
  const slotRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  useFitText(slotRef, textRef, term, 64, true);

  return <div ref={slotRef} data-testid="study-term-slot" className="study-term flex w-full shrink-0 flex-col justify-center overflow-hidden">
    <h1 ref={textRef} lang="ja" className="jp w-full shrink-0 text-[clamp(40px,13vw,64px)] font-light leading-tight text-app-accent">{term}</h1>
  </div>;
}
