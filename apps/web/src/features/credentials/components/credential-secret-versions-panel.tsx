'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
import { canUseCredentialEmergencyAccess } from '@/features/credentials/constants/credential-emergency-access';
import { useCredentialSecretVersions } from '@/features/credentials/hooks/use-credential-secret-versions';
import { useCredentialVaultSession } from '@/features/credentials/hooks/use-credential-vault-session';
import { isCredentialVaultStepUpRequired } from '@/features/credentials/utils/credential-step-up-error';
import { credentialsApi, type CredentialSecretVersion } from '@/lib/api/credentials';
import { usePermission } from '@/lib/permissions';
import { toast } from 'sonner';

function fieldLabel(field: string): string {
  if (field === 'secureNotes') return 'Comment';
  if (field === 'apiKey') return 'API key';
  if (field === 'envData') return 'ENV';
  return field.charAt(0).toUpperCase() + field.slice(1);
}

export interface CredentialSecretVersionsPanelProps {
  credentialId: string;
  sheetOpen: boolean;
  embedded?: boolean;
}

export function CredentialSecretVersionsPanel({
  credentialId,
  sheetOpen,
  embedded = false,
}: CredentialSecretVersionsPanelProps) {
  const { me } = usePermission();
  const vault = useCredentialVaultSession();
  const { items, loading } = useCredentialSecretVersions(credentialId, sheetOpen);
  const [revealTarget, setRevealTarget] = useState<CredentialSecretVersion | null>(null);
  const canReveal =
    canUseCredentialEmergencyAccess(me?.role.slug) ||
    me?.permissions.CREDENTIALS_EDIT === 'ALL' ||
    me?.permissions.CREDENTIALS_VIEW === 'ALL';

  const revealVersion = async (version: CredentialSecretVersion, password?: string) => {
    try {
      const result = await credentialsApi.revealSecretVersion(credentialId, version.id, password);
      await navigator.clipboard.writeText(result.value);
      toast.success(`Copied ${fieldLabel(result.field)} v${result.versionNumber}`);
      await vault.markUnlockedFromStepUp();
      setRevealTarget(null);
    } catch (error) {
      if (!password && isCredentialVaultStepUpRequired(error)) {
        setRevealTarget(version);
        return;
      }
      toast.error('Could not reveal version');
    }
  };

  const onReveal = async (password: string) => {
    if (!revealTarget) return;
    await revealVersion(revealTarget, password);
  };

  return (
    <section
      className={embedded ? 'grid gap-3 pt-3' : 'border-border grid gap-3 border-t pt-5'}
      aria-label="Secret history"
    >
      <div>
        {embedded ? (
          <span className="sr-only">Secret history</span>
        ) : (
          <h3 className="text-sm font-medium">Secret history</h3>
        )}
        <p className="text-muted-foreground mt-1 text-xs">
          Previous encrypted values saved when secrets change. Uses the same daily vault unlock as
          critical live secrets.
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-16 w-full rounded-lg" />
      ) : items.length === 0 ? (
        <p className="text-muted-foreground text-xs">No archived versions yet.</p>
      ) : (
        <ul className="max-h-44 space-y-2 overflow-y-auto text-xs">
          {items.map((row) => (
            <li
              key={row.id}
              className="border-border flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
            >
              <span className="min-w-0">
                {fieldLabel(row.field)} v{row.versionNumber} · {row.source} ·{' '}
                {row.rotatedBy.firstName} {row.rotatedBy.lastName} ·{' '}
                {new Date(row.rotatedAt).toLocaleString()}
              </span>
              {canReveal ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 text-xs"
                  onClick={() => void revealVersion(row)}
                >
                  Reveal
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <CredentialStepUpDialog
        open={revealTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevealTarget(null);
        }}
        title="Unlock vault to reveal historical secret"
        onConfirm={onReveal}
      />
    </section>
  );
}
