'use client';

import DOMPurify from 'dompurify';
import { useEffect, useMemo, useRef } from 'react';
import { MAIL_HTML_BODY_CLASS, MAIL_HTML_PURIFY_CONFIG } from './mail-html-purify-config';

export interface MailMessageBodyProps {
  bodyHtmlSanitized: string | null;
  bodyText: string | null;
}

function hardenMailHtmlLinks(root: HTMLElement): void {
  root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((anchor) => {
    anchor.setAttribute('target', '_blank');
    anchor.setAttribute('rel', 'noopener noreferrer');
  });
}

export function MailMessageBody({ bodyHtmlSanitized, bodyText }: MailMessageBodyProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const safeHtml = useMemo(() => {
    const raw = bodyHtmlSanitized?.trim();
    if (!raw) {
      return null;
    }
    if (typeof window === 'undefined') {
      return raw;
    }
    return DOMPurify.sanitize(raw, MAIL_HTML_PURIFY_CONFIG);
  }, [bodyHtmlSanitized]);

  useEffect(() => {
    if (!safeHtml) {
      return;
    }
    const root = containerRef.current;
    if (!root) {
      return;
    }
    hardenMailHtmlLinks(root);
  }, [safeHtml]);

  if (safeHtml) {
    return (
      <div
        ref={containerRef}
        className={MAIL_HTML_BODY_CLASS}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />
    );
  }

  const plain = bodyText?.trim();
  if (plain) {
    return <pre className="font-sans text-sm whitespace-pre-wrap">{bodyText}</pre>;
  }

  return <p className="text-muted-foreground text-sm">—</p>;
}
