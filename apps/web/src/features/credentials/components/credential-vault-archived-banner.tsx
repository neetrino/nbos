'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CredentialVaultArchivedBannerProps {
  onBackToVault: () => void;
}

export function CredentialVaultArchivedBanner({
  onBackToVault,
}: CredentialVaultArchivedBannerProps) {
  return (
    <div className="border-border bg-muted/40 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm">
      <p className="text-foreground max-w-prose">
        Viewing archived credentials. Restore items from the credential sheet or list actions.
      </p>
      <Button type="button" variant="outline" size="sm" className="gap-2" onClick={onBackToVault}>
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Back to vault
      </Button>
    </div>
  );
}
