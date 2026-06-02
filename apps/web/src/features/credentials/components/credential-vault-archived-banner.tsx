'use client';

import { Archive, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CredentialVaultArchivedBannerProps {
  onBackToVault: () => void;
}

export function CredentialVaultArchivedBanner({
  onBackToVault,
}: CredentialVaultArchivedBannerProps) {
  return (
    <div
      role="status"
      className="border-border bg-muted/70 flex flex-wrap items-center justify-between gap-4 rounded-xl border px-5 py-4"
    >
      <div className="flex min-w-0 items-start gap-3.5">
        <div className="bg-foreground/10 text-foreground flex size-11 shrink-0 items-center justify-center rounded-full">
          <Archive className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-foreground text-base font-semibold tracking-tight">
            Archived credentials
          </p>
          <p className="text-muted-foreground mt-1 max-w-prose text-sm">
            You are viewing archived items. Restore them from the credential sheet or list actions.
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={onBackToVault}>
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Back to vault
      </Button>
    </div>
  );
}
