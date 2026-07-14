'use client';

import { useState, useEffect, useRef, useCallback, useLayoutEffect, useMemo } from 'react';
import { ArrowRight, Ban, RotateCcw, Trash2, LayoutGrid, History } from 'lucide-react';
import { Sheet } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  DetailSheetFormFooter,
  DetailSheetSettingsMenu,
  DetailSheetTabBar,
  DetailSheetTabPanel,
  EntityDetailSheetContent,
  EntityDetailSheetLoadingShell,
} from '@/components/shared';
import type { RelationCreatedEvent } from '@/components/shared/relation-picker';
import { useRegisterRelationCreated } from '@/components/shared/relation-picker/use-register-relation-created';
import { applyLeadRelationCreated } from './apply-lead-relation-created';
import { LeadPipelineStages } from './LeadPipelineStages';
import { LEAD_STAGES } from '../constants/leadPipeline';
import type { Lead } from '@/lib/api/leads';
import { CRM_OPEN_LEAD_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import {
  LEAD_SHEET_SECTION,
  type LeadSheetSectionId,
} from '@/features/shared/crm-sheet-section-ids';
import { LeadGeneralTab } from './LeadGeneralTab';
import {
  buildLeadGeneralPatch,
  createLeadGeneralDraft,
  isLeadGeneralDirty,
  type LeadGeneralDraft,
} from './lead-general-form-state';
import { CrmSheetEntityHeader } from './CrmSheetEntityHeader';
import { getLeadDisplayTitle } from '../utils/crm-entity-display';
import { LEAD_ENTITY_VISUAL } from '@/lib/lead-entity-visual';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';
import type { ApiFieldError } from '@/lib/api-errors';
import { DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS } from '@/components/shared/detail-sheet-classes';
import { cn } from '@/lib/utils';

const TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'history', label: 'History', icon: History },
] as const;

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

  if (!renderLead) {
    return (
      <EntityDetailSheetLoadingShell
        open={open}
        onOpenChange={onOpenChange}
        onOpenChangeComplete={onOpenChangeComplete}
        label="Loading lead…"
        width="medium"
      />
    );
  }

  const currentStage = LEAD_STAGES.find((s) => s.key === renderLead.status);
  const isTerminal = currentStage ? 'terminal' in currentStage : false;
  const leadVisual = LEAD_ENTITY_VISUAL;
  const headerTitle = generalDraft?.name?.trim() || getLeadDisplayTitle(renderLead);
  const LeadIcon = leadVisual.Icon;
  const nameGateRequired = gateRequiredFields.has('name');

  const startEditingName = () => {
    if (isTrashView) return;
    setNameValue(generalDraft?.name ?? renderLead.name ?? '');
    setEditingName(true);
  };

  const commitNameToDraft = () => {
    const trimmed = nameValue.trim();
    setEditingName(false);
    patchGeneralDraft({ name: trimmed || null });
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitNameToDraft();
    }
    if (e.key === 'Escape') {
      setEditingName(false);
      setNameValue(generalDraft?.name ?? renderLead.name ?? '');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
      <EntityDetailSheetContent
        open={open}
        layout="full"
        width="medium"
        sourcePageHref={`/crm/leads?${CRM_OPEN_LEAD_QUERY}=${encodeURIComponent(renderLead.id)}`}
      >
        <CrmSheetEntityHeader
          title={headerTitle}
          entityLabel={leadVisual.label}
          EntityIcon={LeadIcon}
          headerIconClassName={leadVisual.headerIconClassName}
          headerBadgeClassName={leadVisual.headerBadgeClassName}
          editing={editingName}
          nameValue={nameValue}
          onNameValueChange={setNameValue}
          onCommitName={commitNameToDraft}
          onNameKeyDown={handleNameKeyDown}
          nameInputRef={nameInputRef}
          namePlaceholder="Inquiry title (product / service)…"
          titleEditHint="Click to edit inquiry title (product / service)"
          onStartEditing={startEditingName}
          titleClassName={cn(
            nameGateRequired && DETAIL_SHEET_STAGE_GATE_REQUIRED_CLASS,
            'rounded-lg',
          )}
          actions={
            <>
              {!isTrashView && !isTerminal && renderLead.status === 'MQL' && onConvertToDeal ? (
                <Button type="button" size="sm" onClick={() => onConvertToDeal(renderLead)}>
                  <ArrowRight size={14} className="mr-1" />
                  Convert to Deal
                </Button>
              ) : null}
              {isTrashView && onRestore ? (
                <DetailSheetSettingsMenu>
                  <DropdownMenuItem onClick={() => onRestore(renderLead.id)}>
                    <RotateCcw />
                    Restore
                  </DropdownMenuItem>
                  {onPermanentDelete ? (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onPermanentDelete(renderLead.id)}
                    >
                      <Trash2 />
                      Delete permanently
                    </DropdownMenuItem>
                  ) : null}
                </DetailSheetSettingsMenu>
              ) : onMoveToTrash ? (
                <DetailSheetSettingsMenu>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onMoveToTrash(renderLead.id)}
                  >
                    <Trash2 />
                    Move to Trash
                  </DropdownMenuItem>
                  {renderLead.status !== 'SPAM' ? (
                    <DropdownMenuItem onClick={() => void onStatusChange(renderLead.id, 'SPAM')}>
                      <Ban />
                      Mark as Spam
                    </DropdownMenuItem>
                  ) : null}
                </DetailSheetSettingsMenu>
              ) : null}
            </>
          }
        />

        {/* ── Pipeline Stages ── */}
        <div className="shrink-0 border-b border-stone-100 px-5 py-2.5 dark:border-stone-800">
          <LeadPipelineStages
            currentStatus={renderLead.status}
            onStageClick={isTrashView ? () => {} : (key) => onStatusChange(renderLead.id, key)}
          />
        </div>

        <DetailSheetTabBar
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={(value) => setActiveTab(value as (typeof TABS)[number]['value'])}
        />

        {/* ── Content ── */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-5 py-4">
            <DetailSheetTabPanel tabKey={activeTab}>
              {activeTab === 'general' && generalDraft ? (
                <LeadGeneralTab
                  lead={renderLead}
                  draft={generalDraft}
                  patchDraft={patchGeneralDraft}
                  formDisabled={isTrashView}
                  gateRequiredFields={gateRequiredFields}
                  sectionIds={{
                    contact: LEAD_SHEET_SECTION.CONTACT,
                    marketing: LEAD_SHEET_SECTION.MARKETING,
                    assignment: LEAD_SHEET_SECTION.ASSIGNMENT,
                    notes: LEAD_SHEET_SECTION.NOTES,
                  }}
                />
              ) : null}
              {activeTab === 'history' && (
                <div className="text-muted-foreground py-12 text-center text-sm">
                  History coming soon...
                </div>
              )}
            </DetailSheetTabPanel>
          </div>
        </ScrollArea>

        <DetailSheetFormFooter
          visible={!isTrashView && activeTab === 'general' && Boolean(generalDraft)}
          dirty={generalDirty}
          saving={false}
          errorMessage={generalError}
          onSave={handleGeneralSave}
          onCancel={handleGeneralCancel}
        />
      </EntityDetailSheetContent>
    </Sheet>
  );
}
