'use client';

import { CrmCallActivityGate } from '@/features/crm/calls/CrmCallActivityGate';
import { CallActivityTimeline } from '@/features/crm/calls/CallActivityTimeline';

export function DealHistoryTab({ dealId }: { dealId: string }) {
  return (
    <CrmCallActivityGate parent="deal">
      <CallActivityTimeline
        key={dealId}
        scope={{ parent: 'deal', id: dealId }}
        emptyDescription="Calls related to this deal will appear here alongside other activities."
      />
    </CrmCallActivityGate>
  );
}
