'use client';

import { useState } from 'react';
import { Globe } from 'lucide-react';
import { resolveDomainConnectionMode } from '@nbos/shared';
import {
  DETAIL_SHEET_SECTION_BODY_CLASS,
  DetailSheetCollapsibleSection,
  DetailSheetFieldSegmented,
  InlineField,
} from '@/components/shared';
import { Button } from '@/components/ui/button';
import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';
import {
  clientServicesApi,
  type ClientServiceRecord,
  type DomainConnectionMode,
} from '@/lib/api/client-services';
import { getApiErrorMessage } from '@/lib/api-errors';
import { useClientServicesT } from './client-service-message-keys';
import { ClientServiceRegistrantField } from './ClientServiceRegistrantField';

interface ClientServiceConnectionSectionProps {
  service: ClientServiceRecord;
  draft: ClientServiceFormState;
  patchDraft: (partial: Partial<ClientServiceFormState>) => void;
  formDisabled: boolean;
  canEdit: boolean;
  onServiceUpdated: (service: ClientServiceRecord) => void;
}

export function ClientServiceConnectionSection({
  service,
  draft,
  patchDraft,
  formDisabled,
  canEdit,
  onServiceUpdated,
}: ClientServiceConnectionSectionProps) {
  const t = useClientServicesT();
  const [open, setOpen] = useState(true);
  if (draft.type !== 'DOMAIN') return null;
  const mode = resolveDomainConnectionMode(draft.connectionMode);

  return (
    <DetailSheetCollapsibleSection
      title={t('domainPurchase.title')}
      icon={<Globe size={12} />}
      open={open}
      onOpenChange={setOpen}
    >
      <div className={DETAIL_SHEET_SECTION_BODY_CLASS}>
        <DetailSheetFieldSegmented
          label=""
          hideLabel
          disabled={formDisabled}
          value={mode}
          options={[
            { value: 'PURCHASE', label: t('domainPurchase.modePurchase') },
            { value: 'EXISTING_ACCESS', label: t('domainPurchase.modeAccess') },
            { value: 'CLIENT_DNS', label: t('domainPurchase.modeDns') },
          ]}
          onValueChange={(connectionMode: DomainConnectionMode) => patchDraft({ connectionMode })}
        />
        {mode === 'CLIENT_DNS' ? (
          <InlineField
            variant="controlled"
            label={t('domainPurchase.dnsInstructions')}
            type="textarea"
            value={draft.dnsInstructions}
            disabled={formDisabled}
            onValueChange={(dnsInstructions) => patchDraft({ dnsInstructions })}
          />
        ) : null}
        {canEdit && (mode === 'PURCHASE' || service.hasRegistrantData) ? (
          <ClientServiceRegistrantField
            key={service.id}
            serviceId={service.id}
            hasRegistrantData={Boolean(service.hasRegistrantData)}
          />
        ) : null}
        <ConnectionFactButtons
          service={service}
          mode={mode}
          canEdit={canEdit}
          onServiceUpdated={onServiceUpdated}
        />
      </div>
    </DetailSheetCollapsibleSection>
  );
}

function ConnectionFactButtons({
  service,
  mode,
  canEdit,
  onServiceUpdated,
}: {
  service: ClientServiceRecord;
  mode: DomainConnectionMode;
  canEdit: boolean;
  onServiceUpdated: (service: ClientServiceRecord) => void;
}) {
  const t = useClientServicesT();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!canEdit || mode === 'CLIENT_DNS') return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy || Boolean(service.registrationConfirmedAt)}
          onClick={() =>
            void runFact(
              () => clientServicesApi.confirmRegistration(service.id),
              setBusy,
              setError,
              onServiceUpdated,
            )
          }
        >
          {t('domainPurchase.confirmRegistration')}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={busy || Boolean(service.connectionVerifiedAt) || !service.providerAccountId}
          onClick={() =>
            void runFact(
              () => clientServicesApi.confirmConnection(service.id),
              setBusy,
              setError,
              onServiceUpdated,
            )
          }
        >
          {t('domainPurchase.confirmConnection')}
        </Button>
      </div>
      {error ? (
        <p className="text-destructive text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

async function runFact(
  action: () => Promise<ClientServiceRecord>,
  setBusy: (value: boolean) => void,
  setError: (value: string | null) => void,
  onServiceUpdated: (service: ClientServiceRecord) => void,
): Promise<void> {
  setBusy(true);
  setError(null);
  try {
    onServiceUpdated(await action());
  } catch (caught) {
    setError(getApiErrorMessage(caught, 'Update failed'));
  } finally {
    setBusy(false);
  }
}
