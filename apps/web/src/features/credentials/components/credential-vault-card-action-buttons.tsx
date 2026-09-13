'use client';

import { useTranslations } from 'next-intl';
import { ExternalLink, Link2, Star, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { buildCredentialVaultHref } from '@/features/credentials/constants/credential-vault-deep-link';
import { credentialsApi } from '@/lib/api/credentials';
import { cn } from '@/lib/utils';

const DESKTOP_BTN_CLASS = cn(
  'flex size-8 shrink-0 items-center justify-center rounded-lg border shadow-lg',
  'bg-card text-foreground border-border/90',
  'transition-[background-color,border-color,box-shadow,transform,color] duration-150',
  'hover:scale-105 hover:shadow-xl active:scale-95',
  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
);

const MOBILE_BTN_CLASS = cn(
  'flex size-7 shrink-0 items-center justify-center rounded-full border shadow-sm',
  'bg-card/95 text-foreground border-border/90 backdrop-blur-sm',
  'active:scale-95',
  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
);

const BTN_HOVER_TONE_CLASS = {
  default: 'hover:bg-muted hover:border-foreground/20 hover:text-foreground',
  favorite:
    'hover:border-amber-400 hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-950 dark:hover:text-amber-300',
  url: 'hover:border-sky-400 hover:bg-sky-100 hover:text-sky-700 dark:hover:bg-sky-950 dark:hover:text-sky-300',
  link: 'hover:border-primary/50 hover:bg-primary/15 hover:text-primary',
  destructive: 'hover:border-destructive/50 hover:bg-destructive/15 hover:text-destructive',
} as const;

type BtnHoverTone = keyof typeof BTN_HOVER_TONE_CLASS;

export interface CredentialVaultCardActionsProps {
  credentialId: string;
  url: string | null;
  isFavorite: boolean;
  canMoveToTrash?: boolean;
  onSetFavorite?: (favorite: boolean) => void;
  onRequestMoveToTrash?: () => void;
}

function VaultActionButton({
  label,
  onClick,
  tone = 'default',
  active = false,
  activeClassName,
  compact = false,
  children,
}: {
  label: string;
  onClick: () => void;
  tone?: BtnHoverTone;
  active?: boolean;
  activeClassName?: string;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        compact ? MOBILE_BTN_CLASS : DESKTOP_BTN_CLASS,
        !compact && BTN_HOVER_TONE_CLASS[tone],
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

export function useCredentialVaultCardActions({
  credentialId,
  url,
  isFavorite,
  canMoveToTrash = false,
  onSetFavorite,
  onRequestMoveToTrash,
}: CredentialVaultCardActionsProps) {
  const t = useTranslations('credentials');
  const hasUrl = Boolean(url?.trim());
  const showMoveToTrash = canMoveToTrash && Boolean(onRequestMoveToTrash);

  const handleOpenUrl = () => {
    void (async () => {
      try {
        const { url: openUrl } = await credentialsApi.recordUrlOpened(credentialId);
        window.open(openUrl, '_blank', 'noopener,noreferrer');
      } catch {
        toast.error(t('tiles.openUrlFailed'));
      }
    })();
  };

  const handleCopyLink = () => {
    void (async () => {
      try {
        const href = `${window.location.origin}${buildCredentialVaultHref(credentialId)}`;
        await navigator.clipboard.writeText(href);
        toast.success(t('tiles.linkCopied'));
      } catch {
        toast.error(t('tiles.copyLinkFailed'));
      }
    })();
  };

  return {
    hasUrl,
    showMoveToTrash,
    isFavorite,
    onSetFavorite,
    handleOpenUrl,
    handleCopyLink,
    onRequestMoveToTrash,
  };
}

export function CredentialVaultCardActionButtons({
  compact,
  hasUrl,
  showMoveToTrash,
  isFavorite,
  onSetFavorite,
  handleOpenUrl,
  handleCopyLink,
  onRequestMoveToTrash,
}: {
  compact: boolean;
  hasUrl: boolean;
  showMoveToTrash: boolean;
  isFavorite: boolean;
  onSetFavorite?: (favorite: boolean) => void;
  handleOpenUrl: () => void;
  handleCopyLink: () => void;
  onRequestMoveToTrash?: () => void;
}) {
  const t = useTranslations('credentials');
  const iconClass = compact ? 'size-3' : 'size-3.5';

  return (
    <>
      {onSetFavorite ? (
        <VaultActionButton
          label={isFavorite ? t('tiles.removeFavorite') : t('tiles.addFavorite')}
          tone="favorite"
          active={isFavorite}
          activeClassName="border-amber-400 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
          compact={compact}
          onClick={() => onSetFavorite(!isFavorite)}
        >
          <Star className={cn(iconClass, isFavorite && 'fill-current')} aria-hidden />
        </VaultActionButton>
      ) : null}
      {hasUrl ? (
        <VaultActionButton
          label={t('tiles.openUrl')}
          tone="url"
          compact={compact}
          onClick={handleOpenUrl}
        >
          <ExternalLink className={iconClass} aria-hidden />
        </VaultActionButton>
      ) : null}
      <VaultActionButton
        label={t('tiles.copyLink')}
        tone="link"
        compact={compact}
        onClick={handleCopyLink}
      >
        <Link2 className={iconClass} aria-hidden />
      </VaultActionButton>
      {showMoveToTrash ? (
        <VaultActionButton
          label={t('delete.confirm')}
          tone="destructive"
          compact={compact}
          onClick={() => onRequestMoveToTrash?.()}
        >
          <Trash2 className={iconClass} aria-hidden />
        </VaultActionButton>
      ) : null}
    </>
  );
}
