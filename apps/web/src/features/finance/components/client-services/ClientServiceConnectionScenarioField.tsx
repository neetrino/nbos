'use client';

import { GitBranch } from 'lucide-react';
import { InlineField } from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';
import { useClientServicesT } from './client-service-message-keys';

const CONNECTION_SCENARIO_OPTIONS = [
  { value: '', labelKey: 'fields.connectionScenarioEmpty' },
  { value: 'PURCHASE', labelKey: 'scenario.PURCHASE' },
  { value: 'EXISTING_ACCESS', labelKey: 'scenario.EXISTING_ACCESS' },
  { value: 'CLIENT_DNS', labelKey: 'scenario.CLIENT_DNS' },
] as const;

interface ClientServiceConnectionScenarioFieldProps {
  draft: ClientServiceFormState;
  formDisabled: boolean;
  patchDraft: (partial: Partial<ClientServiceFormState>) => void;
  credentialLabel: string | null;
  onCredentialCleared: () => void;
}

export function showClientServiceCredentialField(draft: ClientServiceFormState): boolean {
  return draft.connectionMode !== 'CLIENT_DNS';
}

export function ClientServiceConnectionScenarioField({
  draft,
  formDisabled,
  patchDraft,
  credentialLabel,
  onCredentialCleared,
}: ClientServiceConnectionScenarioFieldProps) {
  const t = useClientServicesT();
  const hasLinkedCredential = Boolean(draft.providerAccountId.trim());

  return (
    <div className="flex flex-col gap-2">
      <InlineField
        variant="controlled"
        label={t('fields.connectionScenario')}
        type="select"
        value={draft.connectionMode}
        icon={<GitBranch size={12} />}
        disabled={formDisabled}
        options={CONNECTION_SCENARIO_OPTIONS.map((option) => ({
          value: option.value,
          label: t(option.labelKey),
        }))}
        onValueChange={(connectionMode) => patchDraft({ connectionMode })}
      />
      {draft.connectionMode === 'CLIENT_DNS' && hasLinkedCredential ? (
        <div className="flex flex-col gap-2 rounded-md border px-3 py-2">
          <p className="text-muted-foreground text-xs">
            {t('domainPurchase.dnsCredentialWarning', {
              name: credentialLabel ?? t('fields.credentials'),
            })}
          </p>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={formDisabled}
            onClick={() => {
              patchDraft({ providerAccountId: '' });
              onCredentialCleared();
            }}
          >
            {t('domainPurchase.unlinkCredential')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
