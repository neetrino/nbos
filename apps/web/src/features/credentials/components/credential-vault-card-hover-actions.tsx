'use client';

import { ExternalLink, Link2, Star, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { buildCredentialVaultHref } from '@/features/credentials/constants/credential-vault-deep-link';
import { credentialsApi } from '@/lib/api/credentials';
import { cn } from '@/lib/utils';

const HOVER_DOCK_CLASS = cn(
  'pointer-events-none absolute inset-x-0 bottom-full z-50 flex flex-col items-center',
  'opacity-0 transition-opacity duration-150',
  'group-hover/card:pointer-events-auto group-hover/card:opacity-100',
  'group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100',
);

/** Invisible hit area between floating buttons and card — prevents hover drop in the gap. */
const HOVER_DOCK_BRIDGE_CLASS = 'h-2 w-full shrink-0';

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

interface CredentialVaultCardHoverActionsProps {
  credentialId: string;
  url: string | null;
  isFavorite: boolean;
  canArchive?: boolean;
  onSetFavorite?: (favorite: boolean) => void;
  onRequestArchive?: () => void;
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

export function CredentialVaultCardHoverActions({
  credentialId,
  url,
  isFavorite,
  canArchive = false,
  onSetFavorite,
  onRequestArchive,
}: CredentialVaultCardHoverActionsProps) {
  const hasUrl = Boolean(url?.trim());
  const showArchive = canArchive && Boolean(onRequestArchive);

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

  return (
    <div
      className={HOVER_DOCK_CLASS}
      data-credential-vault-action
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
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
        {showArchive ? (
          <FloatingVaultActionButton
            label="Archive"
            tone="destructive"
            onClick={() => onRequestArchive?.()}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </FloatingVaultActionButton>
        ) : null}
      </div>
      <div className={HOVER_DOCK_BRIDGE_CLASS} aria-hidden />
    </div>
  );
}
