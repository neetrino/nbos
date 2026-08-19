'use client';

import { useState } from 'react';
import type { Lead } from '@/lib/api/leads';
import { usePermission } from '@/lib/permissions';
import { canShowLeadIdentifySection } from './lead-identify-access';
import { LeadSvyazatDialogs } from './LeadSvyazatDialogs';
import { LeadSvyazatDropdown } from './LeadSvyazatDropdown';
import type { SvyazatMenuMode } from './lead-svyazat-menu-items';

interface LeadSvyazatMenuProps {
  lead: Lead;
  isTrashView: boolean;
  initialAbsorbedId?: string | null;
  onConsumedInitialAbsorbed?: () => void;
  onMerged: (lead: Lead) => void;
  onUpdated: (lead: Lead) => void;
  onTrashed: () => void;
}

export function LeadSvyazatMenu(props: LeadSvyazatMenuProps) {
  const { me } = usePermission();
  const [mode, setMode] = useState<SvyazatMenuMode | null>(null);
  const [applying, setApplying] = useState(false);
  const canShow = canShowLeadIdentifySection({
    lead: props.lead,
    isTrashView: props.isTrashView,
    roleSlug: me?.role.slug,
    actorId: me?.id,
  });

  if (!canShow) return null;

  return (
    <>
      <LeadSvyazatDropdown hasContact={Boolean(props.lead.contactId)} onSelect={setMode} />
      <LeadSvyazatDialogs
        lead={props.lead}
        mode={mode}
        mergeOpen={mode === 'merge' || Boolean(props.initialAbsorbedId)}
        applying={applying}
        setApplying={setApplying}
        setMode={setMode}
        initialAbsorbedId={props.initialAbsorbedId}
        onConsumedInitialAbsorbed={props.onConsumedInitialAbsorbed}
        onMerged={props.onMerged}
        onUpdated={props.onUpdated}
        onTrashed={props.onTrashed}
      />
    </>
  );
}
