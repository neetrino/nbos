'use client';

import { useState } from 'react';
import { History } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { DetailSheetSection } from '@/components/shared';
import {
  DETAIL_SHEET_SECTION_STRETCH_CLASS,
  DETAIL_SHEET_TAB_LIST_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CredentialStepUpDialog } from '@/features/credentials/components/credential-step-up-dialog';
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
  const t = useTranslations('credentials');
  const { me } = usePermission();
  const vault = useCredentialVaultSession();
  const { items, loading } = useCredentialSecretVersions(credentialId, sheetOpen);
  const [revealTarget, setRevealTarget] = useState<CredentialSecretVersion | null>(null);
  const canReveal = Boolean(me);

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
    <>
      <DetailSheetSection
        title={t('form.tabs.secretHistory')}
        icon={<History size={12} />}
        className={embedded ? DETAIL_SHEET_SECTION_STRETCH_CLASS : undefined}
      >
        <p className="text-muted-foreground mb-3 text-xs">{t('form.secretHistoryHint')}</p>
        {loading ? (
          <Skeleton className={cn('w-full rounded-lg', embedded ? 'min-h-32 flex-1' : 'h-16')} />
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-xs">{t('form.secretHistoryEmpty')}</p>
        ) : (
          <ul
            className={cn(
              'space-y-2 text-xs',
              embedded ? DETAIL_SHEET_TAB_LIST_CLASS : 'max-h-44 overflow-y-auto',
            )}
          >
            {items.map((row) => (
              <li
                key={row.id}
                className="border-border flex items-center justify-between gap-2 rounded-xl border px-3 py-2"
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
                    className="h-7 shrink-0 rounded-full text-xs"
                    onClick={() => void revealVersion(row)}
                  >
                    {t('form.secretHistoryReveal')}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </DetailSheetSection>

      <CredentialStepUpDialog
        open={revealTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRevealTarget(null);
        }}
        title="Unlock vault to reveal historical secret"
        onConfirm={onReveal}
      />
    </>
  );
}
