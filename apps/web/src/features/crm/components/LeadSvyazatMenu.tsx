'use client';

import { useState } from 'react';
import { ChevronDown, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getApiErrorMessage } from '@/lib/api-errors';
import { leadsApi, type Lead } from '@/lib/api/leads';
import { usePermission } from '@/lib/permissions';
import { canShowLeadIdentifySection } from './lead-identify-access';
import { LeadMergeDialog } from './LeadMergeDialog';
import { LeadSvyazatAttachWorkDialog } from './LeadSvyazatAttachWorkDialog';
import { LeadSvyazatSearchDialog } from './LeadSvyazatSearchDialog';
import { LEAD_SVYAZAT_LABELS } from './lead-svyazat-labels';
import { useSvyazatEntitySearch } from './use-svyazat-search';

type SvyazatMode = 'merge' | 'pour' | 'create' | 'attach' | null;

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
  const [mode, setMode] = useState<SvyazatMode>(null);
  const [applying, setApplying] = useState(false);
  const canShow = canShowLeadIdentifySection({
    lead: props.lead,
    isTrashView: props.isTrashView,
    roleSlug: me?.role.slug,
    actorId: me?.id,
  });
  const hasContact = Boolean(props.lead.contactId);
  const mergeOpen = mode === 'merge' || Boolean(props.initialAbsorbedId);

  if (!canShow) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={(triggerProps) => (
            <Button {...triggerProps} type="button" size="sm" variant="outline" className="gap-1.5">
              <Link2 size={14} aria-hidden />
              {LEAD_SVYAZAT_LABELS.button}
              <ChevronDown size={14} className="opacity-60" aria-hidden />
            </Button>
          )}
        />
        <DropdownMenuContent align="end" className="min-w-40">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{LEAD_SVYAZAT_LABELS.merge}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setMode('merge')}>
                {LEAD_SVYAZAT_LABELS.mergeLead}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMode('pour')}>
                {LEAD_SVYAZAT_LABELS.mergeContact}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>{LEAD_SVYAZAT_LABELS.add}</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem disabled={hasContact} onClick={() => setMode('create')}>
                {LEAD_SVYAZAT_LABELS.newContact}
              </DropdownMenuItem>
              <DropdownMenuItem disabled={hasContact} onClick={() => setMode('attach')}>
                {LEAD_SVYAZAT_LABELS.contactToWork}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
      <LeadSvyazatDialogs
        lead={props.lead}
        mode={mode}
        mergeOpen={mergeOpen}
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

function LeadSvyazatDialogs(props: {
  lead: Lead;
  mode: SvyazatMode;
  mergeOpen: boolean;
  applying: boolean;
  setApplying: (value: boolean) => void;
  setMode: (mode: SvyazatMode) => void;
  initialAbsorbedId?: string | null;
  onConsumedInitialAbsorbed?: () => void;
  onMerged: (lead: Lead) => void;
  onUpdated: (lead: Lead) => void;
  onTrashed: () => void;
}) {
  const pour = useSvyazatEntitySearch(props.mode === 'pour', 'contact');
  const close = () => {
    props.setMode(null);
    props.onConsumedInitialAbsorbed?.();
  };

  const run = async (work: () => Promise<Lead>, trashedMessage: string, keptMessage: string) => {
    props.setApplying(true);
    try {
      const updated = await work();
      if (updated.trashedAt) {
        toast.success(trashedMessage);
        props.onTrashed();
      } else {
        toast.success(keptMessage);
        props.onUpdated(updated);
      }
      close();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not complete Связать.'));
    } finally {
      props.setApplying(false);
    }
  };

  return (
    <>
      <LeadMergeDialog
        open={props.mergeOpen}
        currentLead={props.lead}
        preselectedAbsorbedId={props.initialAbsorbedId}
        onOpenChange={(open) => {
          if (open) props.setMode('merge');
          else close();
        }}
        onMerged={props.onMerged}
      />
      <LeadSvyazatSearchDialog
        open={props.mode === 'pour'}
        title={LEAD_SVYAZAT_LABELS.mergeContact}
        searchLabel={LEAD_SVYAZAT_LABELS.searchContact}
        placeholder="Name, phone, email…"
        query={pour.query}
        hits={pour.hits}
        selectedId={pour.selectedId}
        loading={pour.loading || props.applying}
        error={pour.error}
        onQueryChange={pour.setQuery}
        onSelect={pour.setSelectedId}
        onOpenChange={(open) => (open ? props.setMode('pour') : close())}
        onApply={() => {
          if (!pour.selectedId) return;
          void run(
            () => leadsApi.pourIntoContact(props.lead.id, { contactId: pour.selectedId as string }),
            'Lead poured into Contact and moved to Trash.',
            'Lead poured into Contact.',
          );
        }}
      />
      <CreateContactConfirmDialog
        open={props.mode === 'create'}
        applying={props.applying}
        onOpenChange={(open) => (open ? props.setMode('create') : close())}
        onApply={() =>
          void run(
            () => leadsApi.createContact(props.lead.id),
            'Contact created.',
            'Contact saved. Lead kept.',
          )
        }
      />
      <LeadSvyazatAttachWorkDialog
        open={props.mode === 'attach'}
        excludeLeadId={props.lead.id}
        applying={props.applying}
        onOpenChange={(open) => (open ? props.setMode('attach') : close())}
        onApply={(attach) =>
          void run(
            () => leadsApi.createContact(props.lead.id, { attach }),
            'Contact added to work. Lead moved to Trash.',
            'Contact added to work.',
          )
        }
      />
    </>
  );
}

function CreateContactConfirmDialog(props: {
  open: boolean;
  applying: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
}) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{LEAD_SVYAZAT_LABELS.createContactTitle}</DialogTitle>
        </DialogHeader>
        <p className="text-sm">{LEAD_SVYAZAT_LABELS.createContactBody}</p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            {LEAD_SVYAZAT_LABELS.cancel}
          </Button>
          <Button type="button" disabled={props.applying} onClick={props.onApply}>
            {LEAD_SVYAZAT_LABELS.createContactApply}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
