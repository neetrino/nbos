'use client';

import type { ReactNode } from 'react';
import { ExternalLink, LayoutDashboard, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const RAIL_CONTROL_CLASS =
  'size-10 shrink-0 rounded-l-full rounded-r-none border-0 bg-primary text-primary-foreground shadow-md hover:bg-primary/90 max-sm:rounded-full';

export interface EntitySheetFloatingRailProps {
  sourcePageHref: string;
  /** When omitted, the workspace shortcut is hidden. */
  workspaceHref?: string | null;
  /** Extra controls below workspace (e.g. open nested portfolio). */
  trailing?: ReactNode;
}

export function EntitySheetFloatingRail({
  sourcePageHref,
  workspaceHref,
  trailing,
}: EntitySheetFloatingRailProps) {
  const handleCopyPageLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const openHref = (href: string) => {
    if (!href || href === '#') return;
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const showWorkspace = Boolean(workspaceHref && workspaceHref !== '#');

  return (
    <>
      <Button
        type="button"
        variant="default"
        size="icon"
        className={cn(RAIL_CONTROL_CLASS)}
        aria-label="Copy page link"
        onClick={() => void handleCopyPageLink()}
      >
        <Link2 className="size-4" aria-hidden />
      </Button>
      <Button
        type="button"
        variant="default"
        size="icon"
        className={cn(RAIL_CONTROL_CLASS)}
        aria-label="Open record in new tab"
        onClick={() => openHref(sourcePageHref)}
        disabled={!sourcePageHref || sourcePageHref === '#'}
      >
        <ExternalLink className="size-4" aria-hidden />
      </Button>
      {showWorkspace && workspaceHref ? (
        <Button
          type="button"
          variant="default"
          size="icon"
          className={cn(RAIL_CONTROL_CLASS)}
          aria-label="Open workspace in new tab"
          onClick={() => openHref(workspaceHref)}
        >
          <LayoutDashboard className="size-4" aria-hidden />
        </Button>
      ) : null}
      {trailing}
    </>
  );
}
