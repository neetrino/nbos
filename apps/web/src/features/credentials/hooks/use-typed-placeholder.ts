import { useEffect, useState } from 'react';

const TYPE_MS = 70;
const HOLD_MS = 1400;

export function useTypedPlaceholder(examples: readonly string[], enabled: boolean): string {
  const [text, setText] = useState(examples[0] ?? '');

  useEffect(() => {
    if (!enabled || examples.length === 0) {
      setText(examples[0] ?? '');
      return;
    }
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setText(examples[0] ?? '');
      return;
    }

    let exampleIndex = 0;
    let charIndex = 0;
    let timeoutId = 0;

    const tick = () => {
      const example = examples[exampleIndex] ?? '';
      if (charIndex <= example.length) {
        setText(example.slice(0, charIndex));
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

    tick();
    return () => window.clearTimeout(timeoutId);
  }, [enabled, examples]);

  return text;
}
