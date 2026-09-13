'use client';

import {
  DETAIL_SHEET_TAB_BODY_STRETCH_CLASS,
  DetailSheetOptionalDescription,
  DetailSheetSection,
} from '@/components/shared';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';
import type {
  ClientServiceRecord,
  ClientServiceRegistryCheckResult,
} from '@/lib/api/client-services';
import { ClientServiceGeneralBasicsSection } from './ClientServiceGeneralBasicsSection';
import { ClientServiceGeneralBillingSection } from './ClientServiceGeneralBillingSection';
import { ClientServiceGeneralDatesSection } from './ClientServiceGeneralDatesSection';
import { useClientServicesT } from './client-service-message-keys';

interface ClientServiceGeneralTabProps {
  serviceId: string;
  service: ClientServiceRecord;
  draft: ClientServiceFormState;
  patchDraft: (partial: Partial<ClientServiceFormState>) => void;
  formDisabled?: boolean;
  onRegistryChecked?: (result: ClientServiceRegistryCheckResult) => void;
}

export function ClientServiceGeneralTab({
  serviceId,
  service,
  draft,
  patchDraft,
  formDisabled = false,
  onRegistryChecked,
}: ClientServiceGeneralTabProps) {
  const t = useClientServicesT();
  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} w-full max-w-none gap-4`}>
      <ClientServiceGeneralBasicsSection
        draft={draft}
        patchDraft={patchDraft}
        productName={service.product?.name ?? null}
        projectName={service.project?.name ?? null}
        credentialName={service.providerAccount?.name ?? null}
        formDisabled={formDisabled}
      />
      <ClientServiceGeneralBillingSection
        draft={draft}
        patchDraft={patchDraft}
        formDisabled={formDisabled}
      />
      <ClientServiceGeneralDatesSection
        service={service}
        draft={draft}
        patchDraft={patchDraft}
        formDisabled={formDisabled}
        onRegistryChecked={onRegistryChecked}
      />
      <DetailSheetSection title={t('sheet.proofs')}>
        <FinanceProofAttachments
          entityType="CLIENT_SERVICE_RECORD"
          entityId={serviceId}
          purpose="EXPENSE_PROOF"
          title=""
        />
      </DetailSheetSection>
      <DetailSheetOptionalDescription
        entityType="generic"
        entityId={serviceId}
        value={draft.notes}
        onChange={(notes) => patchDraft({ notes: notes ?? '' })}
        disabled={formDisabled}
      />
    </div>
  );
}
