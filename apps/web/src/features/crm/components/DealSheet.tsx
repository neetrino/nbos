'use client';

import { useState, useRef, useEffect, useCallback, useLayoutEffect, useMemo } from 'react';
import {
  RotateCcw,
  Trash2,
  LayoutGrid,
  History,
  FileText,
  Phone,
  CheckSquare,
  AlertTriangle,
} from 'lucide-react';
import {
  DetailSheetFormFooter,
  DetailSheetSettingsMenu,
  DetailSheetTabBar,
  EntityDetailSheetContent,
  EntityDetailSheetLoadingShell,
  EntityItemHost,
} from '@/components/shared';
import type { RelationCreatedEvent } from '@/components/shared/relation-picker';
import { useRegisterRelationCreated } from '@/components/shared/relation-picker/use-register-relation-created';
import { applyDealRelationCreated } from './apply-deal-relation-created';
import { Sheet } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DealPipelineStages } from './DealPipelineStages';
import { DealExceptionOrderDialog } from './DealExceptionOrderDialog';
import { DealGeneralTab } from './DealGeneralTab';
import { DealHistoryTab } from './DealHistoryTab';
import { DealInvoiceTab } from './DealInvoiceTab';
import { DealCallsTab } from './DealCallsTab';
import { DealTasksTab } from './DealTasksTab';
import type { Deal } from '@/lib/api/deals';
import { CRM_OPEN_DEAL_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import type { DealSheetBlockerIntent } from '@/features/shared/blocker-actions';
import type { ApiFieldError } from '@/lib/api-errors';
import {
  buildDealGeneralPatch,
  createDealGeneralDraft,
  isDealGeneralDirty,
  type DealGeneralDraft,
} from './deal-general-form-state';
import { CrmSheetEntityHeader } from './CrmSheetEntityHeader';
import { getDealDisplayTitle } from '../utils/crm-entity-display';
import { getDealTypePresentation } from '@/lib/deal-type-visual';

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

export interface DealSheetStageGateHighlight {
  errors: ApiFieldError[];
}

interface DealSheetProps {
  deal: Deal | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: Partial<Deal>) => Promise<void>;
  onStatusChange: (id: string, status: string) => Promise<void>;
  isTrashView?: boolean;
  onMoveToTrash?: (id: string) => void;
  onRestore?: (id: string) => void;
  onRefresh?: () => void;
  onOpenDeal?: (id: string) => void;
  /** One-shot navigation from CRM stage gate shortcuts; consumed via callback. */
  blockerNavigation?: DealSheetBlockerNavigation | null;
  onBlockerNavigationConsumed?: () => void;
  stageGateHighlight?: DealSheetStageGateHighlight | null;
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
  isTrashView = false,
  onMoveToTrash,
  onRestore,
  onRefresh,
  onOpenDeal,
  blockerNavigation = null,
  onBlockerNavigationConsumed,
  stageGateHighlight = null,
}: DealSheetProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [invoiceCreateNonce, setInvoiceCreateNonce] = useState(0);
  const [exceptionDialogOpen, setExceptionDialogOpen] = useState(false);
  const [generalDraft, setGeneralDraft] = useState<DealGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<DealGeneralDraft | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const generalDirtyRef = useRef(false);

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
      queueMicrotask(() => {
        setGeneralDraft(null);
        setGeneralSnap(null);
      });
      return;
    }
    if (generalDirtyRef.current) return;
    const next = createDealGeneralDraft(deal);
    queueMicrotask(() => {
      setGeneralDraft(next);
      setGeneralSnap(next);
    });
  }, [deal?.id, deal?.updatedAt]);

  const patchGeneralDraft = useCallback((partial: Partial<DealGeneralDraft>) => {
    setGeneralDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const generalDirty =
    generalDraft != null && generalSnap != null && isDealGeneralDirty(generalDraft, generalSnap);

  useEffect(() => {
    generalDirtyRef.current = generalDirty;
  }, [generalDirty]);

  const handleGeneralSave = useCallback(() => {
    if (!deal || !generalDraft || !generalSnap) return;
    setGeneralError(null);
    const patch = buildDealGeneralPatch(generalSnap, generalDraft);
    if (Object.keys(patch).length === 0) return;

    const draftAtSave = generalDraft;
    const snapAtSave = generalSnap;
    setGeneralSnap({ ...draftAtSave });

    void (async () => {
      try {
        await onUpdate(deal.id, patch);
        onRefresh?.();
      } catch (err) {
        setGeneralSnap(snapAtSave);
        setGeneralDraft(draftAtSave);
        setGeneralError(dealGeneralSaveErrorMessage(err));
      }
    })();
  }, [deal, generalDraft, generalSnap, onUpdate, onRefresh]);

  const handleGeneralCancel = useCallback(() => {
    setGeneralError(null);
    if (generalSnap) setGeneralDraft({ ...generalSnap });
  }, [generalSnap]);

  useEffect(() => {
    if (!open || !stageGateHighlight) return;
    queueMicrotask(() => setActiveTab('general'));
  }, [open, stageGateHighlight]);

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
    queueMicrotask(() => {
      setEditingName(false);
    });
  }, [deal?.id]);

  const gateRequiredFields = useMemo(() => {
    if (!stageGateHighlight) return new Set<string>();
    return new Set(stageGateHighlight.errors.map((error) => error.field));
  }, [stageGateHighlight]);

  const handleRelationCreated = useCallback((event: RelationCreatedEvent) => {
    setGeneralDraft((prev) => (prev ? applyDealRelationCreated(prev, event) : prev));
  }, []);

  useRegisterRelationCreated(open && generalDraft ? handleRelationCreated : null);

  if (!open) return null;

  if (!deal) {
    return (
      <EntityDetailSheetLoadingShell
        open={open}
        onOpenChange={onOpenChange}
        label="Loading deal…"
      />
    );
  }

  const typeVisual = getDealTypePresentation(deal.type);
  const headerTitle = generalDraft?.name?.trim() || getDealDisplayTitle(deal);
  const TypeIcon = typeVisual.Icon;
  const canCreateExceptionOrder =
    !isTrashView &&
    deal.status !== 'WON' &&
    deal.status !== 'FAILED' &&
    (deal.orders?.length ?? 0) === 0 &&
    (deal.type === 'PRODUCT' || deal.type === 'EXTENSION' || deal.type === 'OUTSOURCE');

  const startEditing = () => {
    if (isTrashView) return;
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
    <EntityItemHost nested onEntityChanged={onRefresh}>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          sourcePageHref={`/crm/deals?${CRM_OPEN_DEAL_QUERY}=${encodeURIComponent(deal.id)}`}
        >
          <CrmSheetEntityHeader
            title={headerTitle}
            entityLabel={typeVisual.label}
            EntityIcon={TypeIcon}
            headerIconClassName={typeVisual.headerIconClassName}
            headerBadgeClassName={typeVisual.headerBadgeClassName}
            editing={editingName}
            nameValue={nameValue}
            onNameValueChange={setNameValue}
            onCommitName={commitNameToDraft}
            onNameKeyDown={handleNameKeyDown}
            nameInputRef={nameInputRef}
            namePlaceholder="Deal name..."
            titleEditHint="Click to edit deal name"
            onStartEditing={startEditing}
            actions={
              isTrashView && onRestore ? (
                <DetailSheetSettingsMenu>
                  <DropdownMenuItem onClick={() => onRestore(deal.id)}>
                    <RotateCcw />
                    Restore
                  </DropdownMenuItem>
                </DetailSheetSettingsMenu>
              ) : onMoveToTrash || canCreateExceptionOrder ? (
                <DetailSheetSettingsMenu>
                  {canCreateExceptionOrder ? (
                    <DropdownMenuItem onClick={() => setExceptionDialogOpen(true)}>
                      <AlertTriangle />
                      Exception order
                    </DropdownMenuItem>
                  ) : null}
                  {onMoveToTrash ? (
                    <DropdownMenuItem variant="destructive" onClick={() => onMoveToTrash(deal.id)}>
                      <Trash2 />
                      Move to Trash
                    </DropdownMenuItem>
                  ) : null}
                </DetailSheetSettingsMenu>
              ) : null
            }
          />

          {/* ── Pipeline Stages (always visible, includes Won/Failed) ── */}
          <div className="shrink-0 border-b border-stone-100 px-5 py-2.5 dark:border-stone-800">
            <DealPipelineStages
              currentStatus={deal.status}
              onStageClick={isTrashView ? () => {} : (key) => onStatusChange(deal.id, key)}
            />
          </div>

          <DetailSheetTabBar
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as (typeof TABS)[number]['value'])}
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-7 py-5">
              {activeTab === 'general' && generalDraft ? (
                <DealGeneralTab
                  deal={deal}
                  draft={generalDraft}
                  patchDraft={patchGeneralDraft}
                  formDisabled={isTrashView}
                  onRefresh={onRefresh}
                  onOpenTaskTab={() => setActiveTab('task')}
                  onOpenDeal={onOpenDeal}
                  gateRequiredFields={gateRequiredFields}
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
            visible={!isTrashView && activeTab === 'general' && Boolean(generalDraft)}
            dirty={generalDirty}
            saving={false}
            errorMessage={generalError}
            onSave={handleGeneralSave}
            onCancel={handleGeneralCancel}
          />
        </EntityDetailSheetContent>
      </Sheet>
      <DealExceptionOrderDialog
        dealId={deal.id}
        open={exceptionDialogOpen}
        onOpenChange={setExceptionDialogOpen}
        onSuccess={() => {
          onRefresh?.();
        }}
      />
    </EntityItemHost>
  );
}
