'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { CredentialVaultCard } from '@/features/credentials/components/CredentialVaultCard';
import type { CredentialListItem } from '@/features/credentials/types/credential-list-item';

const RECENT_CARD_WIDTH_CLASS = 'w-[11.5rem] shrink-0 sm:w-[12.5rem]';

export interface CredentialVaultRecentStripProps {
  credentials: CredentialListItem[];
  loading: boolean;
  onOpenCredential: (id: string) => void;
  onCopyLogin: (login: string) => void;
  onCopyPassword?: (id: string) => void;
  passwordFlashCredentialId?: string | null;
}

export function CredentialVaultRecentStrip({
  credentials,
  loading,
  onOpenCredential,
  onCopyLogin,
  onCopyPassword,
  passwordFlashCredentialId,
}: CredentialVaultRecentStripProps) {
  if (!loading && credentials.length === 0) {
    return null;
  }

  return (
    <section className="border-border flex flex-col gap-2 border-b pb-4" aria-label="Recently used">
      <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        Recently used
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className={`${RECENT_CARD_WIDTH_CLASS} h-[92px] rounded-lg`} />
            ))
          : credentials.map((credential) => (
              <div key={credential.id} className={RECENT_CARD_WIDTH_CLASS}>
                <CredentialVaultCard
                  credential={credential}
                  variant="grid"
                  onOpen={onOpenCredential}
                  onCopyLogin={onCopyLogin}
                  onCopyPassword={onCopyPassword}
                  passwordFlashCredentialId={passwordFlashCredentialId}
                />
              </div>
            ))}
      </div>
    </section>
  );
}
