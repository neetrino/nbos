'use client';

import {
  DETAIL_SHEET_TAB_BODY_STRETCH_CLASS,
  DetailSheetOptionalDescription,
  DetailSheetSection,
} from '@/components/shared';
import { FinanceProofAttachments } from '@/features/finance/components/FinanceProofAttachments';
import type { ClientServiceFormState } from '@/features/finance/utils/client-service-form-state';
import type { ClientServiceRecord } from '@/lib/api/client-services';
import type { Project } from '@/lib/api/projects';
import { ClientServiceGeneralBasicsSection } from './ClientServiceGeneralBasicsSection';
import { ClientServiceGeneralBillingSection } from './ClientServiceGeneralBillingSection';
import { ClientServiceGeneralDatesSection } from './ClientServiceGeneralDatesSection';

interface ClientServiceGeneralTabProps {
  serviceId: string;
  service: ClientServiceRecord;
  draft: ClientServiceFormState;
  patchDraft: (partial: Partial<ClientServiceFormState>) => void;
  projects: Project[];
  formDisabled?: boolean;
}

export function ClientServiceGeneralTab({
  serviceId,
  draft,
  patchDraft,
  projects,
  formDisabled = false,
}: ClientServiceGeneralTabProps) {
  return (
    <div className={`${DETAIL_SHEET_TAB_BODY_STRETCH_CLASS} w-full max-w-none gap-4`}>
      <ClientServiceGeneralBasicsSection
        draft={draft}
        patchDraft={patchDraft}
        projects={projects}
        formDisabled={formDisabled}
      />
      <ClientServiceGeneralBillingSection
        draft={draft}
        patchDraft={patchDraft}
        formDisabled={formDisabled}
      />
      <ClientServiceGeneralDatesSection
        draft={draft}
        patchDraft={patchDraft}
        formDisabled={formDisabled}
      />
      <DetailSheetSection title="Proofs">
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
