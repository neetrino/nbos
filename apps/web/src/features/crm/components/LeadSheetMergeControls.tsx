'use client';

import { useState } from 'react';
import { GitMerge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { canOfferLeadMerge } from '@nbos/shared';
import { usePermission } from '@/lib/permissions';
import type { Lead } from '@/lib/api/leads';
import { LeadMergeDialog } from './LeadMergeDialog';

interface LeadSheetMergeControlsProps {
  lead: Lead;
  isTrashView: boolean;
  initialAbsorbedId?: string | null;
  onConsumedInitialAbsorbed?: () => void;
  onMerged: (survivor: Lead) => void;
}

export function LeadSheetMergeControls({
  lead,
  isTrashView,
  initialAbsorbedId = null,
  onConsumedInitialAbsorbed,
  onMerged,
}: LeadSheetMergeControlsProps) {
  const { me } = usePermission();
  const [open, setOpen] = useState(false);
  const [preselectedAbsorbedId, setPreselectedAbsorbedId] = useState<string | null>(null);
  const canMerge = canOfferLeadMerge(me?.role.slug);

  if (isTrashView || !canMerge) return null;

  const startMerge = (absorbedId?: string | null) => {
    setPreselectedAbsorbedId(absorbedId ?? null);
    setOpen(true);
    onConsumedInitialAbsorbed?.();
  };

  const dialogOpen = open || Boolean(initialAbsorbedId);

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => startMerge()}>
        <GitMerge size={14} className="mr-1" />
        Merge
      </Button>
      <LeadMergeDialog
        open={dialogOpen}
        currentLead={lead}
        preselectedAbsorbedId={preselectedAbsorbedId ?? initialAbsorbedId}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) onConsumedInitialAbsorbed?.();
        }}
        onMerged={onMerged}
      />
    </>
  );
}
