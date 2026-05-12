'use client';

import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { ArrowRight, Trash2, LayoutGrid, History } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DetailSheetFormFooter, DetailSheetSettingsMenu } from '@/components/shared';
import { EntitySheetFloatingRail } from '@/components/shared/entity-sheet-floating-rail';
import { LeadPipelineStages } from './LeadPipelineStages';
import { LEAD_STAGES } from '../constants/leadPipeline';
import type { Lead } from '@/lib/api/leads';
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

const TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'history', label: 'History', icon: History },
] as const;

export interface LeadSheetBlockerNavigation {
  token: number;
  sectionId: LeadSheetSectionId;
}

interface LeadSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Partial<Lead>) => Promise<void>;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onConvertToDeal?: (lead: Lead) => void;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
  blockerNavigation?: LeadSheetBlockerNavigation | null;
  onBlockerNavigationConsumed?: () => void;
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
  onDelete,
  onRefresh,
  blockerNavigation = null,
  onBlockerNavigationConsumed,
}: LeadSheetProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [generalDraft, setGeneralDraft] = useState<LeadGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<LeadGeneralDraft | null>(null);
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const scrollToLeadSection = useCallback((sectionId: LeadSheetSectionId) => {
    setActiveTab('general');
    requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  useLayoutEffect(() => {
    if (!lead) {
      setGeneralDraft(null);
      setGeneralSnap(null);
      return;
    }
    const next = createLeadGeneralDraft(lead);
    setGeneralDraft(next);
    setGeneralSnap(next);
  }, [lead?.id, lead?.updatedAt]);

  const patchGeneralDraft = useCallback((partial: Partial<LeadGeneralDraft>) => {
    setGeneralDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const generalDirty =
    generalDraft != null && generalSnap != null && isLeadGeneralDirty(generalDraft, generalSnap);

  const handleGeneralSave = useCallback(async () => {
    if (!lead || !generalDraft || !generalSnap) return;
    setGeneralError(null);
    const patch = buildLeadGeneralPatch(generalSnap, generalDraft);
    if (Object.keys(patch).length === 0) return;
    setGeneralSaving(true);
    try {
      await onUpdate(lead.id, patch);
      onRefresh?.();
    } catch (err) {
      setGeneralError(leadGeneralSaveErrorMessage(err));
    } finally {
      setGeneralSaving(false);
    }
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
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    setEditingName(false);
  }, [lead?.id]);

  if (!lead) return null;

  const currentStage = LEAD_STAGES.find((s) => s.key === lead.status);
  const isTerminal = currentStage ? 'terminal' in currentStage : false;
  const headerTitle = generalDraft?.name?.trim() || lead.name?.trim() || lead.code;

  const startEditingName = () => {
    setNameValue(generalDraft?.name ?? lead.name ?? '');
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
      setNameValue(generalDraft?.name ?? lead.name ?? '');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        floatingClose
        floatingRailAnchorClassName="sm:right-[min(92vw,1400px)]"
        floatingRail={
          <EntitySheetFloatingRail
            sourcePageHref={`/crm/leads?openLeadId=${encodeURIComponent(lead.id)}`}
          />
        }
        className="flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:data-[side=right]:w-[min(92vw,1400px)]"
      >
        {/* ── Header ── */}
        <div className="bg-background border-border shrink-0 border-b px-7 pt-5 pb-3">
          <div className="flex flex-wrap items-start gap-2">
            <div className="min-w-0 flex-1">
              {editingName ? (
                <input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={commitNameToDraft}
                  onKeyDown={handleNameKeyDown}
                  placeholder="Inquiry title (product / service)…"
                  className="border-primary text-foreground placeholder:text-muted-foreground/70 w-full border-0 border-b-2 bg-transparent text-xl font-bold tracking-tight outline-none"
                />
              ) : (
                <h2
                  onClick={startEditingName}
                  className="text-foreground -mx-1 cursor-text truncate rounded px-1 text-xl font-bold tracking-tight transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                  title="Click to edit inquiry title (product / service)"
                >
                  {headerTitle}
                </h2>
              )}
              <p className="text-muted-foreground mt-0.5 font-mono text-xs tracking-wider">
                {lead.code}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 pt-0.5">
              {!isTerminal && lead.status === 'MQL' && onConvertToDeal ? (
                <Button type="button" size="sm" onClick={() => onConvertToDeal(lead)}>
                  <ArrowRight size={14} className="mr-1" />
                  Convert to Deal
                </Button>
              ) : null}
              {onDelete ? (
                <div className="pt-0.5">
                  <DetailSheetSettingsMenu>
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete(lead.id)}>
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  </DetailSheetSettingsMenu>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* ── Pipeline Stages ── */}
        <div className="shrink-0 border-b border-stone-100 px-5 py-2.5 dark:border-stone-800">
          <LeadPipelineStages
            currentStatus={lead.status}
            onStageClick={(key) => onStatusChange(lead.id, key)}
          />
        </div>

        {/* ── Tabs ── */}
        <div className="shrink-0 border-b border-stone-100 px-5 dark:border-stone-800">
          <div className="flex gap-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setActiveTab(tab.value)}
                  className={
                    'relative flex items-center gap-2 rounded-t-lg px-5 py-3 text-sm font-semibold transition-colors ' +
                    (isActive
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400'
                      : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800/40 dark:hover:text-stone-300')
                  }
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-t-full bg-sky-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Content ── */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="px-7 py-5">
            {activeTab === 'general' && generalDraft ? (
              <LeadGeneralTab
                lead={lead}
                draft={generalDraft}
                patchDraft={patchGeneralDraft}
                formDisabled={generalSaving}
                sectionIds={{
                  contact: LEAD_SHEET_SECTION.CONTACT,
                  marketing: LEAD_SHEET_SECTION.MARKETING,
                  assignment: LEAD_SHEET_SECTION.ASSIGNMENT,
                }}
              />
            ) : null}
            {activeTab === 'history' && (
              <div className="text-muted-foreground py-12 text-center text-sm">
                History coming soon...
              </div>
            )}
          </div>
        </ScrollArea>

        <DetailSheetFormFooter
          visible={activeTab === 'general' && Boolean(generalDraft)}
          dirty={generalDirty}
          saving={generalSaving}
          errorMessage={generalError}
          onSave={() => void handleGeneralSave()}
          onCancel={handleGeneralCancel}
        />
      </SheetContent>
    </Sheet>
  );
}
