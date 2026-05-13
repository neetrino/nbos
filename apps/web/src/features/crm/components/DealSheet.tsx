'use client';

import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { Trash2, LayoutGrid, History, FileText, Phone, CheckSquare } from 'lucide-react';
import { DetailSheetFormFooter, DetailSheetSettingsMenu } from '@/components/shared';
import { EntitySheetFloatingRail } from '@/components/shared/entity-sheet-floating-rail';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DealPipelineStages } from './DealPipelineStages';
import { DealGeneralTab } from './DealGeneralTab';
import { DealHistoryTab } from './DealHistoryTab';
import { DealInvoiceTab } from './DealInvoiceTab';
import { DealCallsTab } from './DealCallsTab';
import { DealTasksTab } from './DealTasksTab';
import type { Deal } from '@/lib/api/deals';
import { CRM_OPEN_DEAL_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import type { DealSheetBlockerIntent } from '@/features/shared/blocker-actions';
import {
  buildDealGeneralPatch,
  createDealGeneralDraft,
  isDealGeneralDirty,
  type DealGeneralDraft,
} from './deal-general-form-state';

const TABS = [
  { value: 'general', label: 'General', icon: LayoutGrid },
  { value: 'history', label: 'History', icon: History },
  { value: 'invoice', label: 'Invoice', icon: FileText },
  { value: 'task', label: 'Task', icon: CheckSquare },
  { value: 'calls', label: 'Calls', icon: Phone },
] as const;

export interface DealSheetBlockerNavigation {
  token: number;
  intent: DealSheetBlockerIntent;
}

interface DealSheetProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Partial<Deal>) => Promise<void>;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
  onOpenDeal?: (id: string) => void;
  /** One-shot navigation from CRM stage gate shortcuts; consumed via callback. */
  blockerNavigation?: DealSheetBlockerNavigation | null;
  onBlockerNavigationConsumed?: () => void;
}

function dealGeneralSaveErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  return 'Could not save changes.';
}

export function DealSheet({
  deal,
  open,
  onOpenChange,
  onUpdate,
  onStatusChange,
  onDelete,
  onRefresh,
  onOpenDeal,
  blockerNavigation = null,
  onBlockerNavigationConsumed,
}: DealSheetProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [invoiceCreateNonce, setInvoiceCreateNonce] = useState(0);
  const [generalDraft, setGeneralDraft] = useState<DealGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<DealGeneralDraft | null>(null);
  const [generalSaving, setGeneralSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const applyBlockerIntent = useCallback((intent: DealSheetBlockerIntent) => {
    if (intent.kind === 'tab') {
      setActiveTab(intent.tab);
      return;
    }
    if (intent.kind === 'general-section') {
      setActiveTab('general');
      requestAnimationFrame(() => {
        document
          .getElementById(intent.sectionId)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    setActiveTab('invoice');
    setInvoiceCreateNonce((previous) => previous + 1);
  }, []);

  useLayoutEffect(() => {
    if (!deal) {
      setGeneralDraft(null);
      setGeneralSnap(null);
      return;
    }
    const next = createDealGeneralDraft(deal);
    setGeneralDraft(next);
    setGeneralSnap(next);
  }, [deal?.id, deal?.updatedAt]);

  const patchGeneralDraft = useCallback((partial: Partial<DealGeneralDraft>) => {
    setGeneralDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const generalDirty =
    generalDraft != null && generalSnap != null && isDealGeneralDirty(generalDraft, generalSnap);

  const handleGeneralSave = useCallback(async () => {
    if (!deal || !generalDraft || !generalSnap) return;
    setGeneralError(null);
    const patch = buildDealGeneralPatch(generalSnap, generalDraft);
    if (Object.keys(patch).length === 0) return;
    setGeneralSaving(true);
    try {
      await onUpdate(deal.id, patch);
      onRefresh?.();
    } catch (err) {
      setGeneralError(dealGeneralSaveErrorMessage(err));
    } finally {
      setGeneralSaving(false);
    }
  }, [deal, generalDraft, generalSnap, onUpdate, onRefresh]);

  const handleGeneralCancel = useCallback(() => {
    setGeneralError(null);
    if (generalSnap) setGeneralDraft({ ...generalSnap });
  }, [generalSnap]);

  useEffect(() => {
    if (!open || !blockerNavigation) return;
    const { intent } = blockerNavigation;
    queueMicrotask(() => {
      applyBlockerIntent(intent);
      onBlockerNavigationConsumed?.();
    });
  }, [open, blockerNavigation, applyBlockerIntent, onBlockerNavigationConsumed]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    setEditingName(false);
  }, [deal?.id]);

  if (!deal) return null;

  const headerTitle = generalDraft?.name?.trim() || deal.name?.trim() || deal.code;

  const startEditing = () => {
    setNameValue(generalDraft?.name ?? deal.name ?? '');
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
      setNameValue(generalDraft?.name ?? deal.name ?? '');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={false}
        floatingClose
        floatingRailVisible={open}
        floatingRailAnchorClassName="sm:right-[75vw]"
        floatingRail={
          <EntitySheetFloatingRail
            sourcePageHref={`/crm/deals?${CRM_OPEN_DEAL_QUERY}=${encodeURIComponent(deal.id)}`}
          />
        }
        className="flex w-full flex-col gap-0 overflow-hidden p-0 data-[side=right]:w-full sm:max-w-none sm:data-[side=right]:w-[75vw]"
      >
        {/* ── Header ── */}
        <div className="bg-background border-border shrink-0 border-b px-7 pt-5 pb-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              {editingName ? (
                <input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={commitNameToDraft}
                  onKeyDown={handleNameKeyDown}
                  placeholder="Deal name..."
                  className="border-primary text-foreground placeholder:text-muted-foreground/70 w-full border-0 border-b-2 bg-transparent text-xl font-bold tracking-tight outline-none"
                />
              ) : (
                <h2
                  onClick={startEditing}
                  className="text-foreground -mx-1 cursor-text truncate rounded px-1 text-xl font-bold tracking-tight transition-colors hover:bg-stone-100 dark:hover:bg-stone-800"
                  title="Click to edit deal name"
                >
                  {headerTitle}
                </h2>
              )}
              <p className="text-muted-foreground mt-0.5 font-mono text-xs tracking-wider">
                {deal.code}
              </p>
            </div>
            {onDelete ? (
              <div className="pt-0.5">
                <DetailSheetSettingsMenu>
                  <DropdownMenuItem variant="destructive" onClick={() => onDelete(deal.id)}>
                    <Trash2 />
                    Delete
                  </DropdownMenuItem>
                </DetailSheetSettingsMenu>
              </div>
            ) : null}
          </div>
        </div>

        {/* ── Pipeline Stages (always visible, includes Won/Failed) ── */}
        <div className="shrink-0 border-b border-stone-100 px-5 py-2.5 dark:border-stone-800">
          <DealPipelineStages
            currentStatus={deal.status}
            onStageClick={(key) => onStatusChange(deal.id, key)}
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

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-7 py-5">
            {activeTab === 'general' && generalDraft ? (
              <DealGeneralTab
                deal={deal}
                draft={generalDraft}
                patchDraft={patchGeneralDraft}
                formDisabled={generalSaving}
                onRefresh={onRefresh}
                onOpenTaskTab={() => setActiveTab('task')}
                onOpenDeal={onOpenDeal}
              />
            ) : null}
            {activeTab === 'history' && <DealHistoryTab />}
            {activeTab === 'invoice' && (
              <DealInvoiceTab
                deal={deal}
                onRefresh={onRefresh}
                expandCreateFormNonce={invoiceCreateNonce}
              />
            )}
            {activeTab === 'task' && <DealTasksTab deal={deal} onRefresh={onRefresh} />}
            {activeTab === 'calls' && <DealCallsTab />}
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
