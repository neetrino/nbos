'use client';

import type { ReactNode } from 'react';
import { ExternalLink, LayoutDashboard, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/** Shared rail control base (close + action buttons). */
const ENTITY_SHEET_FLOATING_RAIL_CONTROL_BASE_CLASS =
  'group/rail-control relative h-11 w-11 shrink-0 self-end overflow-visible rounded-full border-0 bg-primary text-primary-foreground shadow-md transition-[width,background-color] duration-150 ease-out hover:bg-primary/90 active:translate-y-0 sm:rounded-l-full sm:rounded-r-none';

/** Copy / Open / Dashboard / Close — lengthen slightly to the left on hover. */
export const ENTITY_SHEET_FLOATING_RAIL_CONTROL_CLASS = cn(
  ENTITY_SHEET_FLOATING_RAIL_CONTROL_BASE_CLASS,
  'hover:w-14 focus-visible:w-14',
);

/** Vertical stack — right edges align to sheet seam; overflow visible so hover lengthens left. */
export const ENTITY_SHEET_FLOATING_RAIL_STACK_CLASS =
  'flex flex-col items-end gap-1.5 overflow-visible';

export const ENTITY_SHEET_FLOATING_RAIL_HINT_CLASS =
  'pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background opacity-0 shadow-lg transition-all duration-150 group-hover/rail-control:translate-x-0 group-hover/rail-control:opacity-100 group-focus-visible/rail-control:translate-x-0 group-focus-visible/rail-control:opacity-100 max-sm:left-full max-sm:ml-2 max-sm:translate-x-1 sm:right-full sm:mr-2 sm:-translate-x-1';

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
        className={cn(ENTITY_SHEET_FLOATING_RAIL_CONTROL_CLASS)}
        aria-label="Copy page link"
        title="Copy link"
        onClick={() => void handleCopyPageLink()}
      >
        <Link2 className="size-4" aria-hidden />
        <span className={ENTITY_SHEET_FLOATING_RAIL_HINT_CLASS}>Copy link</span>
      </Button>
      <Button
        type="button"
        variant="default"
        size="icon"
        className={cn(ENTITY_SHEET_FLOATING_RAIL_CONTROL_CLASS)}
        aria-label="Open record in new tab"
        title="Open"
        onClick={() => openHref(sourcePageHref)}
        disabled={!sourcePageHref || sourcePageHref === '#'}
      >
        <ExternalLink className="size-4" aria-hidden />
        <span className={ENTITY_SHEET_FLOATING_RAIL_HINT_CLASS}>Open</span>
      </Button>
      {showWorkspace && workspaceHref ? (
        <Button
          type="button"
          variant="default"
          size="icon"
          className={cn(ENTITY_SHEET_FLOATING_RAIL_CONTROL_CLASS)}
          aria-label="Open workspace in new tab"
          title="Dashboard"
          onClick={() => openHref(workspaceHref)}
        >
          <LayoutDashboard className="size-4" aria-hidden />
          <span className={ENTITY_SHEET_FLOATING_RAIL_HINT_CLASS}>Dashboard</span>
        </Button>
      ) : null}
      {trailing}
    </>
  );
}
