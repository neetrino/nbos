'use client';

import { ExternalLink, Link2, Star, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { buildCredentialVaultHref } from '@/features/credentials/constants/credential-vault-deep-link';
import { credentialsApi } from '@/lib/api/credentials';
import { cn } from '@/lib/utils';
import { PORTAL_DROPDOWN_Z_CLASS } from '@/lib/overlay-z-index';

/** Keeps hover while the pointer crosses the gap into the floating dock. */
const HOVER_DOCK_HIDE_DELAY_MS = 120;

const HOVER_DOCK_BRIDGE_CLASS = 'h-2 w-full shrink-0';

const FLOATING_DOCK_CLASS = cn(
  'pointer-events-auto fixed flex -translate-x-1/2 -translate-y-full flex-col items-center',
  PORTAL_DROPDOWN_Z_CLASS,
);

const FLOATING_BTN_CLASS = cn(
  'flex size-8 shrink-0 items-center justify-center rounded-lg border shadow-lg',
  'bg-card text-foreground border-border/90',
  'transition-[background-color,border-color,box-shadow,transform,color] duration-150',
  'hover:scale-105 hover:shadow-xl active:scale-95',
  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
);

const FLOATING_BTN_HOVER_TONE_CLASS = {
  default: 'hover:bg-muted hover:border-foreground/20 hover:text-foreground',
  favorite:
    'hover:border-amber-400 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-950 dark:hover:text-amber-300',
  url: 'hover:border-sky-400 hover:bg-sky-100 hover:text-sky-700 dark:hover:bg-sky-950 dark:hover:text-sky-300',
  link: 'hover:border-primary/50 hover:bg-primary/15 hover:text-primary',
  destructive: 'hover:border-destructive/50 hover:bg-destructive/15 hover:text-destructive',
} as const;

type FloatingBtnHoverTone = keyof typeof FLOATING_BTN_HOVER_TONE_CLASS;

interface DockPosition {
  top: number;
  left: number;
}

interface CredentialVaultCardHoverActionsProps {
  credentialId: string;
  url: string | null;
  isFavorite: boolean;
  canMoveToTrash?: boolean;
  onSetFavorite?: (favorite: boolean) => void;
  onRequestMoveToTrash?: () => void;
}

function FloatingVaultActionButton({
  label,
  onClick,
  tone = 'default',
  active = false,
  activeClassName,
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: FloatingBtnHoverTone;
  active?: boolean;
  activeClassName?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        FLOATING_BTN_CLASS,
        FLOATING_BTN_HOVER_TONE_CLASS[tone],
        active && activeClassName,
      )}
      aria-label={label}
      title={label}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      {children}
    </button>
  );
}

function readDockPosition(card: HTMLElement): DockPosition {
  const rect = card.getBoundingClientRect();
  return {
    top: rect.top,
    left: rect.left + rect.width / 2,
  };
}

export function CredentialVaultCardHoverActions({
  credentialId,
  url,
  isFavorite,
  canMoveToTrash = false,
  onSetFavorite,
  onRequestMoveToTrash,
}: CredentialVaultCardHoverActionsProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<DockPosition | null>(null);
  const hasUrl = Boolean(url?.trim());
  const showMoveToTrash = canMoveToTrash && Boolean(onRequestMoveToTrash);

  const clearHideTimer = useCallback(() => {
    if (!hideTimerRef.current) return;
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = null;
  }, []);

  const showDock = useCallback(() => {
    const card = anchorRef.current?.parentElement;
    if (!card) return;
    clearHideTimer();
    setPosition(readDockPosition(card));
    setOpen(true);
  }, [clearHideTimer]);

  const scheduleHideDock = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setOpen(false);
      hideTimerRef.current = null;
    }, HOVER_DOCK_HIDE_DELAY_MS);
  }, [clearHideTimer]);

  useEffect(() => {
    const card = anchorRef.current?.parentElement;
    if (!card) return;

    const onFocusOut = (event: FocusEvent) => {
      if (card.contains(event.relatedTarget as Node | null)) return;
      scheduleHideDock();
    };

    card.addEventListener('mouseenter', showDock);
    card.addEventListener('mouseleave', scheduleHideDock);
    card.addEventListener('focusin', showDock);
    card.addEventListener('focusout', onFocusOut);

    return () => {
      card.removeEventListener('mouseenter', showDock);
      card.removeEventListener('mouseleave', scheduleHideDock);
      card.removeEventListener('focusin', showDock);
      card.removeEventListener('focusout', onFocusOut);
      clearHideTimer();
    };
  }, [showDock, scheduleHideDock, clearHideTimer]);

  useEffect(() => {
    if (!open) return;
    const onReposition = () => {
      const card = anchorRef.current?.parentElement;
      if (!card) return;
      setPosition(readDockPosition(card));
    };
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
  }, [open]);

  const handleOpenUrl = () => {
    void (async () => {
      try {
        const { url: openUrl } = await credentialsApi.recordUrlOpened(credentialId);
        window.open(openUrl, '_blank', 'noopener,noreferrer');
      } catch {
        toast.error('Could not open URL');
      }
    })();
  };

  const handleCopyLink = () => {
    void (async () => {
      try {
        const href = `${window.location.origin}${buildCredentialVaultHref(credentialId)}`;
        await navigator.clipboard.writeText(href);
        toast.success('Link copied');
      } catch {
        toast.error('Could not copy link');
      }
    })();
  };

  const dock =
    open && position ? (
      <div
        className={FLOATING_DOCK_CLASS}
        style={{ top: position.top, left: position.left }}
        data-credential-vault-action
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => event.stopPropagation()}
        onMouseEnter={showDock}
        onMouseLeave={scheduleHideDock}
      >
        <div className="flex gap-1.5">
          {onSetFavorite ? (
            <FloatingVaultActionButton
              label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              tone="favorite"
              active={isFavorite}
              activeClassName="border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              onClick={() => onSetFavorite(!isFavorite)}
            >
              <Star className={cn('size-3.5', isFavorite && 'fill-current')} aria-hidden />
            </FloatingVaultActionButton>
          ) : null}
          {hasUrl ? (
            <FloatingVaultActionButton label="Open URL" tone="url" onClick={handleOpenUrl}>
              <ExternalLink className="size-3.5" aria-hidden />
            </FloatingVaultActionButton>
          ) : null}
          <FloatingVaultActionButton label="Copy link" tone="link" onClick={handleCopyLink}>
            <Link2 className="size-3.5" aria-hidden />
          </FloatingVaultActionButton>
          {showMoveToTrash ? (
            <FloatingVaultActionButton
              label="Move to Trash"
              tone="destructive"
              onClick={() => onRequestMoveToTrash?.()}
            >
              <Trash2 className="size-3.5" aria-hidden />
            </FloatingVaultActionButton>
          ) : null}
        </div>
        <div className={HOVER_DOCK_BRIDGE_CLASS} aria-hidden />
      </div>
    ) : null;

  return (
    <>
      <div
        ref={anchorRef}
        className="pointer-events-none absolute inset-x-0 top-0 h-0"
        aria-hidden
      />
      {dock && typeof document !== 'undefined' ? createPortal(dock, document.body) : null}
    </>
  );
}
