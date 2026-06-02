'use client';

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { AtSign, Check, Copy, KeyRound, Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, StatusBadge } from '@/components/shared';
import { cn } from '@/lib/utils';
import { getCredentialCategoryMeta } from '@/features/credentials/constants/credential-category-meta';
import { getCredentialCriticality } from '@/features/credentials/constants/credentials';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';
import { PermissionGate } from '@/lib/permissions';

const TILE_SKELETON_COUNT = 12;
const PASSWORD_MASK = '••••••';
export const CREDENTIAL_VAULT_TILE_COPY_FEEDBACK_MS = 1000;
const TILE_BADGE_CLASS = 'h-4 shrink-0 px-1.5 py-0 text-[10px] leading-none';

/** 4 columns on small viewports; 5–6 on large (vault tiles canon). */
export const CREDENTIAL_VAULT_TILE_GRID_CLASS =
  'grid grid-cols-4 gap-2 lg:grid-cols-5 2xl:grid-cols-6';

const CREDENTIAL_VAULT_TILE_SHELL_CLASS = cn(
  'border-border bg-card group/tile relative flex cursor-pointer flex-col overflow-hidden rounded-lg border',
  'shadow-none transition-shadow duration-200 ease-out',
  'hover:shadow-md',
  'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
);

/** Fixed size — no lines at rest; inset outline + copy only on card hover (no layout shift). */
const TILE_SECRET_PILL_CLASS = cn(
  'flex h-7 w-full cursor-pointer items-center gap-2 rounded-lg border-0 bg-transparent px-2 text-left shadow-none outline-none',
  'transition-[background-color,box-shadow,opacity] duration-200',
  'group-hover/tile:bg-muted/25 group-hover/tile:shadow-[inset_0_0_0_1px_var(--border)]',
);

const TILE_SECRET_COPY_ICON_CLASS = cn(
  'flex size-7 shrink-0 items-center justify-center opacity-0 transition-opacity duration-200',
  'group-hover/tile:opacity-100',
);

const TILE_SECRET_PILL_COPIED_CLASS = cn(
  'bg-emerald-500/15 text-emerald-800 shadow-[inset_0_0_0_1px_rgb(16_185_129/0.45)] dark:text-emerald-300',
  'group-hover/tile:bg-emerald-500/15 group-hover/tile:shadow-[inset_0_0_0_1px_rgb(16_185_129/0.45)]',
);

interface TileSecretPillProps {
  icon: ReactNode;
  value: string;
  copyLabel: string;
  mono?: boolean;
  copied?: boolean;
  onCopy: () => void;
}

function TileSecretPill({
  icon,
  value,
  copyLabel,
  mono = true,
  copied: copiedExternal = false,
  onCopy,
}: TileSecretPillProps) {
  const [copiedLocal, setCopiedLocal] = useState(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copied = copiedExternal || copiedLocal;

  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const handleCopy = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onCopy();
    if (copiedExternal) return;
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setCopiedLocal(true);
    feedbackTimerRef.current = setTimeout(
      () => setCopiedLocal(false),
      CREDENTIAL_VAULT_TILE_COPY_FEEDBACK_MS,
    );
  };

  return (
    <button
      type="button"
      className={cn(TILE_SECRET_PILL_CLASS, copied && TILE_SECRET_PILL_COPIED_CLASS)}
      title={copyLabel}
      aria-label={copyLabel}
      onClick={handleCopy}
    >
      <span
        className={cn(
          'shrink-0',
          copied ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[11px] leading-tight',
          copied ? 'text-emerald-800 dark:text-emerald-200' : 'text-foreground',
          mono && 'font-mono',
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          copied ? 'text-emerald-600 opacity-100 dark:text-emerald-400' : 'text-muted-foreground',
          TILE_SECRET_COPY_ICON_CLASS,
          copied && 'opacity-100',
        )}
        aria-hidden
      >
        {copied ? <Check size={11} strokeWidth={2.5} /> : <Copy size={11} />}
      </span>
    </button>
  );
}

interface TileSecretsStripProps {
  login: string | null;
  showPassword: boolean;
  passwordCopied: boolean;
  onCopyLogin: (login: string) => void;
  onCopyPassword: () => void;
}

function TileSecretsStrip({
  login,
  showPassword,
  passwordCopied,
  onCopyLogin,
  onCopyPassword,
}: TileSecretsStripProps) {
  if (!login && !showPassword) return null;

  return (
    <div className="flex flex-col gap-1">
      {login ? (
        <TileSecretPill
          icon={<AtSign size={12} strokeWidth={2} />}
          value={login}
          copyLabel="Copy login"
          onCopy={() => onCopyLogin(login)}
        />
      ) : null}
      {showPassword ? (
        <TileSecretPill
          icon={<Lock size={12} strokeWidth={2} />}
          value={PASSWORD_MASK}
          copyLabel="Copy password"
          copied={passwordCopied}
          mono
          onCopy={onCopyPassword}
        />
      ) : null}
    </div>
  );
}

export interface CredentialVaultTilesProps {
  credentials: CredentialListItem[];
  loading: boolean;
  showCreate: boolean;
  onCreateOpen: () => void;
  onOpenCredential: (id: string) => void;
  onCopyLogin: (login: string) => void;
  onCopyPassword?: (credentialId: string) => void;
  passwordFlashCredentialId?: string | null;
}

function CredentialVaultTile({
  credential,
  onOpenCredential,
  onCopyLogin,
  onCopyPassword,
  passwordFlashCredentialId,
}: {
  credential: CredentialListItem;
  onOpenCredential: (id: string) => void;
  onCopyLogin: (login: string) => void;
  onCopyPassword?: (credentialId: string) => void;
  passwordFlashCredentialId?: string | null;
}) {
  const category = getCredentialCategoryMeta(credential.category);
  const criticality = getCredentialCriticality(credential.criticality);
  const showCriticality =
    criticality && (credential.criticality === 'HIGH' || credential.criticality === 'CRITICAL');
  const showPassword = Boolean(onCopyPassword) && Boolean(credential.secretsPresent?.password);

  return (
    <div
      role="button"
      tabIndex={0}
      className={CREDENTIAL_VAULT_TILE_SHELL_CLASS}
      onClick={() => onOpenCredential(credential.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenCredential(credential.id);
        }
      }}
    >
      <span
        className={cn('absolute top-0 bottom-0 left-0 w-0.5', category.accentBarClass)}
        aria-hidden
      />
      <div className="flex flex-col gap-1.5 p-2.5 pl-3">
        <div className="flex min-w-0 flex-wrap items-center gap-1">
          <StatusBadge
            label={category.label}
            variant={category.badgeVariant}
            className={TILE_BADGE_CLASS}
          />
          {showCriticality ? (
            <StatusBadge
              label={criticality.label}
              variant={criticality.variant}
              className={TILE_BADGE_CLASS}
            />
          ) : null}
        </div>
        <p className="text-foreground line-clamp-2 min-h-[2lh] text-[11px] leading-snug font-medium">
          {credential.name}
        </p>
        <TileSecretsStrip
          login={credential.login}
          showPassword={showPassword}
          passwordCopied={passwordFlashCredentialId === credential.id}
          onCopyLogin={onCopyLogin}
          onCopyPassword={() => onCopyPassword!(credential.id)}
        />
      </div>
    </div>
  );
}

export function CredentialVaultTiles({
  credentials,
  loading,
  showCreate,
  onCreateOpen,
  onOpenCredential,
  onCopyLogin,
  onCopyPassword,
  passwordFlashCredentialId,
}: CredentialVaultTilesProps) {
  if (loading) {
    return (
      <div className={CREDENTIAL_VAULT_TILE_GRID_CLASS}>
        {Array.from({ length: TILE_SKELETON_COUNT }).map((_, index) => (
          <Skeleton key={index} className="h-[92px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (credentials.length === 0) {
    return (
      <EmptyState
        icon={KeyRound}
        title="No credentials"
        description="No credentials match the current filters"
        action={
          showCreate ? (
            <PermissionGate module="CREDENTIALS" action="ADD">
              <Button onClick={onCreateOpen}>
                <Plus size={16} /> Add Credential
              </Button>
            </PermissionGate>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className={CREDENTIAL_VAULT_TILE_GRID_CLASS}>
      {credentials.map((credential) => (
        <CredentialVaultTile
          key={credential.id}
          credential={credential}
          onOpenCredential={onOpenCredential}
          onCopyLogin={onCopyLogin}
          onCopyPassword={onCopyPassword}
          passwordFlashCredentialId={passwordFlashCredentialId}
        />
      ))}
    </div>
  );
}
