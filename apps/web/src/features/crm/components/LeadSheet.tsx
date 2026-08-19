'use client';

import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import { leadsApi, type Lead, type LeadDuplicateLookupResult } from '@/lib/api/leads';
import { LeadSheetLoadedContent } from './LeadSheetLoadedContent';
import { Sheet } from '@/components/ui/sheet';
import { EntityDetailSheetContent } from '@/components/shared';
import type { RelationCreatedEvent } from '@/components/shared/relation-picker';
import { useRegisterRelationCreated } from '@/components/shared/relation-picker/use-register-relation-created';
import { applyLeadRelationCreated } from './apply-lead-relation-created';
import { type LeadSheetSectionId } from '@/features/shared/crm-sheet-section-ids';
import {
  buildLeadGeneralPatch,
  createLeadGeneralDraft,
  isLeadGeneralDirty,
  type LeadGeneralDraft,
} from './lead-general-form-state';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';
import type { ApiFieldError } from '@/lib/api-errors';

export interface LeadSheetBlockerNavigation {
  token: number;
  sectionId: LeadSheetSectionId;
}

export interface LeadSheetStageGateHighlight {
  errors: ApiFieldError[];
}

interface LeadSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Partial<Lead>) => Promise<void>;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onConvertToDeal?: (lead: Lead) => void;
  isTrashView?: boolean;
  onMoveToTrash?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onRefresh?: () => void;
  onOpenRelatedLead?: (id: string) => void;
  onMerged?: (lead: Lead) => void;
  blockerNavigation?: LeadSheetBlockerNavigation | null;
  onBlockerNavigationConsumed?: () => void;
  stageGateHighlight?: LeadSheetStageGateHighlight | null;
}

function leadGeneralSaveErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Could not save changes.';
}

export function LeadSheet({
  lead,
  open,
  onOpenChange,
  onUpdate,
  onStatusChange,
  onConvertToDeal,
  isTrashView = false,
  onMoveToTrash,
  onRestore,
  onPermanentDelete,
  onRefresh,
  onOpenRelatedLead,
  onMerged,
  blockerNavigation = null,
  onBlockerNavigationConsumed,
  stageGateHighlight = null,
}: LeadSheetProps) {
  const { persistedValue: renderLead, onOpenChangeComplete } = useSheetPersistedValue(lead);
  const hostMounted = useSheetHostMounted(open, renderLead);

  const [activeTab, setActiveTab] = useState('general');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [generalDraft, setGeneralDraft] = useState<LeadGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<LeadGeneralDraft | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [phoneDuplicates, setPhoneDuplicates] = useState<LeadDuplicateLookupResult | null>(null);
  const [mergeAbsorbedId, setMergeAbsorbedId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const generalDirtyRef = useRef(false);

  const scrollToLeadSection = useCallback((sectionId: LeadSheetSectionId) => {
    setActiveTab('general');
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  useLayoutEffect(() => {
    if (!lead) {
      queueMicrotask(() => {
        setGeneralDraft(null);
        setGeneralSnap(null);
      });
      return;
    }
    if (generalDirtyRef.current) return;
    const next = createLeadGeneralDraft(lead);
    queueMicrotask(() => {
      setGeneralDraft(next);
      setGeneralSnap(next);
    });
    queueMicrotask(() => setPhoneDuplicates(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draft sync keyed on lead.id
  }, [lead?.id, lead?.updatedAt]);

  const patchGeneralDraft = useCallback((partial: Partial<LeadGeneralDraft>) => {
    setGeneralDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const generalDirty =
    generalDraft != null && generalSnap != null && isLeadGeneralDirty(generalDraft, generalSnap);

  useEffect(() => {
    generalDirtyRef.current = generalDirty;
  }, [generalDirty]);

  const handleGeneralSave = useCallback(() => {
    if (!lead || !generalDraft || !generalSnap) return;
    setGeneralError(null);
    const patch = buildLeadGeneralPatch(generalSnap, generalDraft);
    if (Object.keys(patch).length === 0) return;

    const draftAtSave = generalDraft;
    const snapAtSave = generalSnap;
    setGeneralSnap({ ...draftAtSave });

    void (async () => {
      try {
        await onUpdate(lead.id, patch);
        onRefresh?.();
        const addedPhone = !snapAtSave.phone?.trim() && Boolean(draftAtSave.phone?.trim());
        if (addedPhone && draftAtSave.phone) {
          const result = await leadsApi.findDuplicates({
            phone: draftAtSave.phone,
            excludeId: lead.id,
          });
          setPhoneDuplicates(result);
        } else {
          setPhoneDuplicates(null);
        }
      } catch (err) {
        setGeneralSnap(snapAtSave);
        setGeneralDraft(draftAtSave);
        setGeneralError(leadGeneralSaveErrorMessage(err));
      }
    })();
  }, [lead, generalDraft, generalSnap, onUpdate, onRefresh]);

  const handleGeneralCancel = useCallback(() => {
    setGeneralError(null);
    if (generalSnap) setGeneralDraft({ ...generalSnap });
  }, [generalSnap]);

  useEffect(() => {
    if (!open || !blockerNavigation) return;
    const { sectionId } = blockerNavigation;
    queueMicrotask(() => {
      scrollToLeadSection(sectionId);
      onBlockerNavigationConsumed?.();
    });
  }, [open, blockerNavigation, scrollToLeadSection, onBlockerNavigationConsumed]);

  useEffect(() => {
    if (!open || !stageGateHighlight) return;
    queueMicrotask(() => setActiveTab('general'));
  }, [open, stageGateHighlight]);

  const gateRequiredFields = useMemo(() => {
    if (!stageGateHighlight) return new Set<string>();
    return new Set(stageGateHighlight.errors.map((error) => error.field));
  }, [stageGateHighlight]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    queueMicrotask(() => {
      setEditingName(false);
    });
  }, [lead?.id]);

  const handleRelationCreated = useCallback((event: RelationCreatedEvent) => {
    setGeneralDraft((prev) => (prev ? applyLeadRelationCreated(prev, event) : prev));
  }, []);

  useRegisterRelationCreated(open && generalDraft ? handleRelationCreated : null);

  if (!hostMounted) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      {!renderLead ? (
        <EntityDetailSheetContent open={open} layout="full" width="medium">
          <div className="text-muted-foreground flex items-center gap-2 p-5 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Loading lead…
          </div>
        </EntityDetailSheetContent>
      ) : (
        <LeadSheetLoadedContent
          renderLead={renderLead}
          open={open}
          isTrashView={isTrashView}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          editingName={editingName}
          nameValue={nameValue}
          setNameValue={setNameValue}
          setEditingName={setEditingName}
          nameInputRef={nameInputRef}
          generalDraft={generalDraft}
          generalDirty={generalDirty}
          generalError={generalError}
          gateRequiredFields={gateRequiredFields}
          onConvertToDeal={onConvertToDeal}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
          onMoveToTrash={onMoveToTrash}
          onStatusChange={onStatusChange}
          patchGeneralDraft={patchGeneralDraft}
          handleGeneralSave={handleGeneralSave}
          handleGeneralCancel={handleGeneralCancel}
          phoneDuplicates={phoneDuplicates}
          onDismissPhoneDuplicates={() => setPhoneDuplicates(null)}
          onOpenRelatedLead={onOpenRelatedLead}
          onMerged={onMerged}
          mergeAbsorbedId={mergeAbsorbedId}
          onMergeFromBanner={(id) => setMergeAbsorbedId(id)}
          onConsumedMergeAbsorbed={() => setMergeAbsorbedId(null)}
          onAttached={(updated) => {
            onMerged?.(updated);
            onRefresh?.();
          }}
          onAttachedAndTrashed={() => {
            onRefresh?.();
            onOpenChange(false);
          }}
        />
      )}
    </Sheet>
  );
}
