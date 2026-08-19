'use client';

import { splitSearchHighlight } from './highlight-search-match';

interface GlobalSearchHighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

export function GlobalSearchHighlightText({
  text,
  query,
  className,
}: GlobalSearchHighlightTextProps) {
  const segments = splitSearchHighlight(text, query);

  return (
    <span className={className}>
      {segments.map((segment, index) =>
        segment.match ? (
          <strong key={`${segment.text}-${index}`} className="text-foreground font-semibold">
            {segment.text}
          </strong>
        ) : (
          <span key={`${segment.text}-${index}`}>{segment.text}</span>
        ),
      )}
    </span>
  );
}
