import { useEffect, useState } from 'react';

const TYPE_MS = 70;
const HOLD_MS = 1400;

export function useTypedPlaceholder(examples: readonly string[], enabled: boolean): string {
  const fallback = examples[0] ?? '';
  const [typed, setTyped] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || examples.length === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let exampleIndex = 0;
    let charIndex = 0;
    let timeoutId = 0;

    const tick = () => {
      const example = examples[exampleIndex] ?? '';
      if (charIndex <= example.length) {
        setTyped(example.slice(0, charIndex));
        charIndex += 1;
        timeoutId = window.setTimeout(tick, TYPE_MS);
        return;
      }
      timeoutId = window.setTimeout(() => {
        exampleIndex = (exampleIndex + 1) % examples.length;
        charIndex = 0;
        tick();
      }, HOLD_MS);
    };

    timeoutId = window.setTimeout(tick, TYPE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [enabled, examples]);

  if (!enabled || examples.length === 0) return fallback;
  return typed ?? fallback;
}
