'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-errors';
import { leadsApi, type Lead, type LeadDuplicateLookupResult } from '@/lib/api/leads';

const IDENTIFY_LOOKUP_DEBOUNCE_MS = 350;
const INCOMING_CALL_PREFIX = 'Incoming call';

export function identifySearchFromLead(lead: Lead): string {
  const name = lead.contactName.trim();
  if (!name || name.startsWith(INCOMING_CALL_PREFIX)) return '';
  return name;
}

export function useLeadIdentifyCandidates(lead: Lead | null, enabled: boolean) {
  const leadId = lead?.id ?? null;
  const phone = lead?.phone?.trim() ?? '';
  const email = lead?.email?.trim() ?? '';
  const search = lead ? identifySearchFromLead(lead) : '';
  const [resultByLeadId, setResultByLeadId] = useState<Record<string, LeadDuplicateLookupResult>>(
    {},
  );
  const queryReady = Boolean(phone || email || search.trim());

  useEffect(() => {
    if (!enabled || !leadId || !queryReady) return;
    const handle = window.setTimeout(() => {
      void leadsApi
        .findDuplicates({
          phone: phone || undefined,
          email: email || undefined,
          q: search.trim() || undefined,
          excludeId: leadId,
        })
        .then((data) => {
          setResultByLeadId((prev) => ({ ...prev, [leadId]: data }));
        })
        .catch((err) => {
          setResultByLeadId((prev) => {
            const next = { ...prev };
            delete next[leadId];
            return next;
          });
          toast.error(getApiErrorMessage(err, 'Could not look up existing Contacts or Deals.'));
        });
    }, IDENTIFY_LOOKUP_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [enabled, leadId, phone, email, search, queryReady]);

  return {
    result: enabled && queryReady && leadId ? (resultByLeadId[leadId] ?? null) : null,
  };
}
