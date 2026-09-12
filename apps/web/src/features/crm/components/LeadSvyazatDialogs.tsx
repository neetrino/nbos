'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getApiErrorMessage } from '@/lib/api-errors';
import { leadsApi, type Lead } from '@/lib/api/leads';
import { LeadMergeDialog } from './LeadMergeDialog';
import { LeadSvyazatAttachWorkDialog } from './LeadSvyazatAttachWorkDialog';
import { LeadSvyazatSearchDialog } from './LeadSvyazatSearchDialog';
import type { SvyazatMenuMode } from './lead-svyazat-menu-items';
import { useSvyazatEntitySearch } from './use-svyazat-search';

interface LeadSvyazatDialogsProps {
  lead: Lead;
  mode: SvyazatMenuMode | null;
  mergeOpen: boolean;
  applying: boolean;
  setApplying: (value: boolean) => void;
  setMode: (mode: SvyazatMenuMode | null) => void;
  initialAbsorbedId?: string | null;
  onConsumedInitialAbsorbed?: () => void;
  onMerged: (lead: Lead) => void;
  onUpdated: (lead: Lead) => void;
  onTrashed: () => void;
}

type SvyazatRun = (
  work: () => Promise<Lead>,
  trashedMessage: string,
  keptMessage: string,
) => Promise<void>;

export function LeadSvyazatDialogs(props: LeadSvyazatDialogsProps) {
  const t = useTranslations('crm');
  const close = () => {
    props.setMode(null);
    props.onConsumedInitialAbsorbed?.();
  };
  const run = createSvyazatRun(props, close, t('svyazat.completeError'));

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
      <SvyazatActionDialogs
        leadId={props.lead.id}
        mode={props.mode}
        applying={props.applying}
        setMode={props.setMode}
        close={close}
        run={run}
      />
    </>
  );
}

function createSvyazatRun(
  props: Pick<LeadSvyazatDialogsProps, 'setApplying' | 'onTrashed' | 'onUpdated'>,
  close: () => void,
  completeError: string,
): SvyazatRun {
  return async (work, trashedMessage, keptMessage) => {
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
      toast.error(getApiErrorMessage(err, completeError));
    } finally {
      props.setApplying(false);
    }
  };
}

function SvyazatActionDialogs(props: {
  leadId: string;
  mode: SvyazatMenuMode | null;
  applying: boolean;
  setMode: (mode: SvyazatMenuMode | null) => void;
  close: () => void;
  run: SvyazatRun;
}) {
  const t = useTranslations('crm');
  return (
    <>
      <PourContactDialog
        open={props.mode === 'pour'}
        leadId={props.leadId}
        applying={props.applying}
        onOpenChange={(open) => (open ? props.setMode('pour') : props.close())}
        onRun={props.run}
      />
      <CreateContactConfirmDialog
        open={props.mode === 'create'}
        applying={props.applying}
        onOpenChange={(open) => (open ? props.setMode('create') : props.close())}
        onApply={() =>
          void props.run(
            () => leadsApi.createContact(props.leadId),
            t('svyazat.contactCreated'),
            t('svyazat.contactSavedLeadKept'),
          )
        }
      />
      <LeadSvyazatAttachWorkDialog
        open={props.mode === 'attach'}
        excludeLeadId={props.leadId}
        applying={props.applying}
        onOpenChange={(open) => (open ? props.setMode('attach') : props.close())}
        onApply={(attach) =>
          void props.run(
            () => leadsApi.createContact(props.leadId, { attach }),
            t('svyazat.contactAddedToWorkTrashed'),
            t('svyazat.contactAddedToWork'),
          )
        }
      />
    </>
  );
}

function PourContactDialog(props: {
  open: boolean;
  leadId: string;
  applying: boolean;
  onOpenChange: (open: boolean) => void;
  onRun: (work: () => Promise<Lead>, trashedMessage: string, keptMessage: string) => Promise<void>;
}) {
  const t = useTranslations('crm');
  const pour = useSvyazatEntitySearch(props.open, 'contact');
  return (
    <LeadSvyazatSearchDialog
      open={props.open}
      title={t('svyazat.pourTitle')}
      description={t('svyazat.pourHint')}
      searchLabel={t('svyazat.searchContact')}
      placeholder={t('svyazat.searchPlaceholder')}
      query={pour.query}
      hits={pour.hits}
      selectedId={pour.selectedId}
      loading={pour.loading || props.applying}
      error={pour.error}
      onQueryChange={pour.setQuery}
      onSelect={pour.setSelectedId}
      onOpenChange={props.onOpenChange}
      onApply={() => {
        if (!pour.selectedId) return;
        void props.onRun(
          () => leadsApi.pourIntoContact(props.leadId, { contactId: pour.selectedId as string }),
          t('svyazat.pouredTrashed'),
          t('svyazat.pouredKept'),
        );
      }}
    />
  );
}

function CreateContactConfirmDialog(props: {
  open: boolean;
  applying: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: () => void;
}) {
  const t = useTranslations('crm');
  const tCommon = useTranslations('common');
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[440px]" forceNestedBackdrop>
        <DialogHeader>
          <DialogTitle>{t('svyazat.createContactTitle')}</DialogTitle>
          <DialogDescription>{t('svyazat.createContactBody')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button type="button" disabled={props.applying} onClick={props.onApply}>
            {t('svyazat.createContactApply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
