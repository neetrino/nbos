'use client';

import { Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import { useCredentialVaultSession } from '@/features/credentials/hooks/use-credential-vault-session';
import { useState } from 'react';
import { toast } from 'sonner';

function formatUnlockExpiry(iso: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function CredentialVaultUnlockBanner() {
  const vault = useCredentialVaultSession();
  const [unlockOpen, setUnlockOpen] = useState(false);

  if (vault.loading) return null;

  const handleUnlock = async (password: string) => {
    try {
      await vault.unlock(password);
      toast.success('Vault unlocked for 24 hours');
      setUnlockOpen(false);
    } catch {
      toast.error('Could not unlock vault');
    }
  };

  return (
    <>
      <div className="border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
        <div className="text-muted-foreground flex min-w-0 items-center gap-2">
          {vault.unlocked ? (
            <Unlock size={14} className="shrink-0 text-emerald-600" aria-hidden />
          ) : (
            <Lock size={14} className="shrink-0" aria-hidden />
          )}
          <span>
            {vault.unlocked && vault.expiresAt
              ? `Critical secrets unlocked until ${formatUnlockExpiry(vault.expiresAt)}`
              : 'LOW/MEDIUM secrets: no extra password. HIGH/CRITICAL: unlock once per day.'}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {vault.unlocked ? (
            <Button type="button" variant="outline" size="sm" onClick={() => void vault.lock()}>
              Lock vault
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={() => setUnlockOpen(true)}>
              Unlock vault
            </Button>
          )}
        </div>
      </div>

      <CredentialStepUpDialog
        open={unlockOpen}
        onOpenChange={setUnlockOpen}
        title="Unlock vault for 24 hours"
        onConfirm={handleUnlock}
      />
    </>
  );
}
