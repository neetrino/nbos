'use client';

import { DetailSheetFieldSegmented, InlineField } from '@/components/shared';
import { ClientServiceCredentialField } from '@/features/finance/components/client-services/ClientServiceCredentialField';
import { useClientServicesT } from '@/features/finance/components/client-services/client-service-message-keys';
import type { DomainConnectionMode } from '@/lib/api/client-services';
import { DomainPurchaseDomainRows } from './DomainPurchaseDomainRows';
import type { DomainPurchaseDraft } from './domain-purchase-form';

interface DomainPurchaseFormFieldsProps {
  draft: DomainPurchaseDraft;
  projectId: string | null;
  requireClientAmount?: boolean;
  onChange: (draft: DomainPurchaseDraft) => void;
}

export function DomainPurchaseFormFields({
  draft,
  projectId,
  requireClientAmount = false,
  onChange,
}: DomainPurchaseFormFieldsProps) {
  const t = useClientServicesT();
  const mode = draft.connectionMode;

  return (
    <div className="flex flex-col gap-3">
      <DetailSheetFieldSegmented
        label=""
        hideLabel
        ariaLabel={t('domainPurchase.title')}
        value={mode}
        options={[
          { value: 'PURCHASE', label: t('domainPurchase.modePurchase') },
          { value: 'EXISTING_ACCESS', label: t('domainPurchase.modeAccess') },
          { value: 'CLIENT_DNS', label: t('domainPurchase.modeDns') },
        ]}
        onValueChange={(connectionMode: DomainConnectionMode) =>
          onChange({ ...draft, connectionMode })
        }
      />
      <DomainPurchaseDomainRows
        draft={draft}
        requireClientAmount={requireClientAmount}
        onChange={onChange}
      />
      {mode !== 'CLIENT_DNS' ? (
        <ClientServiceCredentialField
          credentialId={draft.providerAccountId}
          credentialLabel={draft.credentialLabel}
          projectId={projectId}
          onSelect={(providerAccountId, credentialLabel) =>
            onChange({ ...draft, providerAccountId, credentialLabel })
          }
          onClear={() => onChange({ ...draft, providerAccountId: '', credentialLabel: null })}
        />
      ) : (
        <InlineField
          variant="controlled"
          label={t('domainPurchase.dnsInstructions')}
          type="textarea"
          value={draft.dnsInstructions}
          onValueChange={(dnsInstructions) => onChange({ ...draft, dnsInstructions })}
        />
      )}
      {mode === 'PURCHASE' ? (
        <InlineField
          variant="controlled"
          label={t('domainPurchase.registrant')}
          type="textarea"
          value={draft.registrantData}
          onValueChange={(registrantData) => onChange({ ...draft, registrantData })}
        />
      ) : null}
      <p className="text-muted-foreground text-xs">{t('domainPurchase.currencyHint')}</p>
    </div>
  );
}
