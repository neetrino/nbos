'use client';

import DOMPurify from 'dompurify';
import { useMemo } from 'react';

const PURIFY_CONFIG = {
  USE_PROFILES: { html: true },
} as const;

export interface DocumentHtmlViewerProps {
  html: string | null | undefined;
}

export function DocumentHtmlViewer({ html }: DocumentHtmlViewerProps) {
  const safe = useMemo(() => {
    const raw = html?.trim();
    if (!raw) return '';
    return DOMPurify.sanitize(raw, PURIFY_CONFIG);
  }, [html]);

  if (!safe) {
    return <p className="text-muted-foreground text-sm">No content yet.</p>;
  }

  return (
    <div
      className="nbos-document-html text-foreground [&_a]:text-primary [&_blockquote]:border-border [&_blockquote]:text-muted-foreground [&_code]:bg-muted [&_pre]:bg-muted [&_td]:border-border [&_th]:border-border [&_th]:bg-muted/50 max-w-none text-sm [&_a]:underline [&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:mt-3 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:my-0.5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:text-xs [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_th]:text-left [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
