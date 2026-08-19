'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const { search, setSearch, result } = useLeadIdentifyCandidates(lead, canAttach);
  const [attaching, setAttaching] = useState(false);

  if (!canAttach) return null;

  const attach = async (contactId: string, aboutDealId?: string) => {
    setAttaching(true);
    try {
      const updated = await leadsApi.attachContact(lead.id, { contactId, aboutDealId });
      if (updated.trashedAt) {
        toast.success('Inbound treated as the open Deal. Stray Lead moved to Trash.');
        onAttachedAndTrashed();
        return;
      }
      toast.success('Lead attached to Contact.');
      onAttached(updated);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not attach this Lead.'));
    } finally {
      setAttaching(false);
    }
  };

  return (
    <div className="mb-4 space-y-2">
      <div className="space-y-1.5">
        <Label htmlFor="lead-identify-search">Identify person</Label>
        <Input
          id="lead-identify-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search Contact by name…"
        />
      </div>
      {result && hasDuplicateHits(result) ? (
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
      ) : null}
    </div>
  );
}

function openInNewTab(href: string): void {
  window.open(href, '_blank', 'noopener,noreferrer');
}
