'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { leadsApi, type Lead } from '@/lib/api/leads';
import { usePermission } from '@/lib/permissions';
import { CRM_OPEN_DEAL_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import { LeadDuplicateBanner, hasDuplicateHits } from './LeadDuplicateBanner';
import { canShowLeadIdentifySection } from './lead-identify-access';
import { useLeadIdentifyCandidates } from './use-lead-identify-candidates';

interface LeadSheetIdentifySectionProps {
  lead: Lead;
  isTrashView: boolean;
  onOpenRelatedLead?: (id: string) => void;
  onAttached: (lead: Lead) => void;
  onAttachedAndTrashed: () => void;
}

export function LeadSheetIdentifySection({
  lead,
  isTrashView,
  onOpenRelatedLead,
  onAttached,
  onAttachedAndTrashed,
}: LeadSheetIdentifySectionProps) {
  const { me } = usePermission();
  const canAttach = canShowLeadIdentifySection({
    lead,
    isTrashView,
    roleSlug: me?.role.slug,
    actorId: me?.id,
  });
  const { result } = useLeadIdentifyCandidates(lead, canAttach);
  const [attaching, setAttaching] = useState(false);

  if (!canAttach || !result || !hasDuplicateHits(result)) return null;

  const attach = async (contactId: string, aboutDealId?: string) => {
    setAttaching(true);
    try {
      const updated = aboutDealId
        ? await leadsApi.attachContact(lead.id, { contactId, aboutDealId })
        : await leadsApi.pourIntoContact(lead.id, { contactId });
      if (updated.trashedAt) {
        toast.success(
          aboutDealId
            ? 'Inbound treated as the open Deal. Stray Lead moved to Trash.'
            : 'Lead poured into Contact and moved to Trash.',
        );
        onAttachedAndTrashed();
        return;
      }
      toast.success('Lead attached to Contact.');
      onAttached(updated);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not complete Связать.'));
    } finally {
      setAttaching(false);
    }
  };

  return (
    <div className="mb-4 space-y-2">
      <LeadDuplicateBanner
        result={result}
        mode="identify"
        canAttach={canAttach}
        attaching={attaching}
        onOpen={onOpenRelatedLead ?? (() => undefined)}
        onOpenContact={(id) => openInNewTab(`/clients/contacts?openId=${id}`)}
        onOpenDeal={(id) => openInNewTab(`/crm/deals?${CRM_OPEN_DEAL_QUERY}=${id}`)}
        onAttachContact={(contactId, aboutDealId) => void attach(contactId, aboutDealId)}
      />
    </div>
  );
}

function openInNewTab(href: string): void {
  window.open(href, '_blank', 'noopener,noreferrer');
}
