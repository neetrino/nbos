'use client';

import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CredentialVaultTrashBannerProps {
  onBackToVault: () => void;
}

export function CredentialVaultTrashBanner({ onBackToVault }: CredentialVaultTrashBannerProps) {
  return (
    <div
      role="status"
      className="border-border bg-muted/70 border-l-destructive flex flex-wrap items-center justify-between gap-4 rounded-xl border border-l-4 px-5 py-4"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="bg-destructive/15 text-destructive flex size-11 shrink-0 items-center justify-center rounded-full">
          <Trash2 className="size-5" aria-hidden />
        </div>
        <p className="text-foreground text-base font-semibold tracking-tight">Trash</p>
      </div>
      <Button type="button" variant="outline" className="shrink-0 gap-2" onClick={onBackToVault}>
        <ArrowLeft className="size-4 shrink-0" aria-hidden />
        Back to vault
      </Button>
    </div>
  );
}
