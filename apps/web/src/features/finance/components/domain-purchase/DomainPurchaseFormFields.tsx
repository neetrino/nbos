'use client';

import { DetailSheetFieldSegmented, InlineField } from '@/components/shared';
import { ClientServiceCredentialField } from '@/features/finance/components/client-services/ClientServiceCredentialField';
import { ClientServiceRegistrantField } from '@/features/finance/components/client-services/ClientServiceRegistrantField';
import { useClientServicesT } from '@/features/finance/components/client-services/client-service-message-keys';
import type { ClientServiceRecord, DomainConnectionMode } from '@/lib/api/client-services';
import { DomainConnectionFactButtons } from './DomainConnectionFactButtons';
import { DomainPurchaseDomainRows } from './DomainPurchaseDomainRows';
import type { DomainPurchaseDraft } from './domain-purchase-form';

interface DomainPurchaseFormFieldsProps {
  draft: DomainPurchaseDraft;
  projectId: string | null;
  services: readonly ClientServiceRecord[];
  allowAdd?: boolean;
  canEditFacts?: boolean;
  onChange: (draft: DomainPurchaseDraft) => void;
  onServiceUpdated?: (service: ClientServiceRecord) => void;
}

export function DomainPurchaseFormFields({
  draft,
  projectId,
  services,
  allowAdd = true,
  canEditFacts = false,
  onChange,
  onServiceUpdated,
}: DomainPurchaseFormFieldsProps) {
  const t = useClientServicesT();
  const mode = draft.connectionMode;
  const continueService = services.find((row) => row.id === draft.domains[0]?.serviceId) ?? null;

  return (
    <div className="flex flex-col gap-3">
      <DetailSheetFieldSegmented
        label=""
        hideLabel
        density="plain"
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
      <DomainPurchaseDomainRows draft={draft} allowAdd={allowAdd} onChange={onChange} />
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
      ) : null}
      {mode === 'PURCHASE' && continueService ? (
        <ClientServiceRegistrantField
          key={continueService.id}
          serviceId={continueService.id}
          hasRegistrantData={Boolean(continueService.hasRegistrantData)}
        />
      ) : null}
      {mode === 'PURCHASE' && !continueService ? (
        <InlineField
          variant="controlled"
          label={t('domainPurchase.registrant')}
          type="textarea"
          value={draft.registrantData}
          onValueChange={(registrantData) => onChange({ ...draft, registrantData })}
        />
      ) : null}
      {continueService && onServiceUpdated ? (
        <DomainConnectionFactButtons
          service={continueService}
          mode={mode}
          canEdit={canEditFacts}
          onServiceUpdated={onServiceUpdated}
        />
      ) : null}
    </div>
  );
}
