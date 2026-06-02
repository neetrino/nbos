'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { CredentialVaultCard } from '@/features/credentials/components/CredentialVaultCard';
import { CREDENTIAL_VAULT_TILE_GRID_CLASS } from '@/features/credentials/constants/credential-vault-tile-grid';
import { CREDENTIAL_VAULT_RECENT_LIMIT } from '@/features/credentials/constants/credential-vault';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

export interface CredentialVaultRecentStripProps {
  credentials: CredentialListItem[];
  loading: boolean;
  searchActive: boolean;
  onOpenCredential: (id: string) => void;
  onCopyLogin: (login: string) => void;
  onCopyPassword?: (id: string) => void;
  passwordFlashCredentialId?: string | null;
}

export function CredentialVaultRecentStrip({
  credentials,
  loading,
  searchActive,
  onOpenCredential,
  onCopyLogin,
  onCopyPassword,
  passwordFlashCredentialId,
}: CredentialVaultRecentStripProps) {
  if (!loading && credentials.length === 0) {
    return null;
  }

  const title = searchActive ? 'Recently used (matching search)' : 'Recently used';

  return (
    <section className="border-border flex flex-col gap-2 border-b pb-4" aria-label="Recently used">
      <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{title}</h2>
      <div className={CREDENTIAL_VAULT_TILE_GRID_CLASS}>
        {loading
          ? Array.from({ length: CREDENTIAL_VAULT_RECENT_LIMIT }).map((_, index) => (
              <Skeleton key={index} className="h-[92px] w-full rounded-lg" />
            ))
          : credentials.map((credential) => (
              <CredentialVaultCard
                key={credential.id}
                credential={credential}
                variant="grid"
                onOpen={onOpenCredential}
                onCopyLogin={onCopyLogin}
                onCopyPassword={onCopyPassword}
                passwordFlashCredentialId={passwordFlashCredentialId}
              />
            ))}
      </div>
    </section>
  );
}
