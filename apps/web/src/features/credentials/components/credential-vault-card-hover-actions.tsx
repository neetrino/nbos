'use client';

import { ExternalLink, Link2, Star, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { buildCredentialVaultHref } from '@/features/credentials/constants/credential-vault-deep-link';
import { credentialsApi } from '@/lib/api/credentials';
import { cn } from '@/lib/utils';

const HOVER_BAR_CLASS = cn(
  'pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 flex -translate-x-1/2 gap-1.5',
  'opacity-0 transition-opacity duration-150',
  'group-hover/card:pointer-events-auto group-hover/card:opacity-100',
  'group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100',
);

const FLOATING_BTN_CLASS = cn(
  'flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-foreground shadow-md',
  'transition-colors hover:bg-muted/60',
  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
);

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
  active = false,
  activeClassName,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  activeClassName?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(FLOATING_BTN_CLASS, active && activeClassName)}
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
    <div className={HOVER_BAR_CLASS} data-credential-vault-action>
      {onSetFavorite ? (
        <FloatingVaultActionButton
          label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          active={isFavorite}
          activeClassName="border-amber-300/70 text-amber-500"
          onClick={() => onSetFavorite(!isFavorite)}
        >
          <Star className={cn('size-3.5', isFavorite && 'fill-current')} aria-hidden />
        </FloatingVaultActionButton>
      ) : null}
      {hasUrl ? (
        <FloatingVaultActionButton label="Open URL" onClick={handleOpenUrl}>
          <ExternalLink className="size-3.5" aria-hidden />
        </FloatingVaultActionButton>
      ) : null}
      <FloatingVaultActionButton label="Copy link" onClick={handleCopyLink}>
        <Link2 className="size-3.5" aria-hidden />
      </FloatingVaultActionButton>
      {showArchive ? (
        <FloatingVaultActionButton
          label="Archive"
          onClick={() => onRequestArchive?.()}
          activeClassName="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-3.5" aria-hidden />
        </FloatingVaultActionButton>
      ) : null}
    </div>
  );
}
