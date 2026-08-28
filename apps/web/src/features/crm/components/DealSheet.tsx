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
  Loader2,
} from 'lucide-react';
import {
  DetailSheetFormFooter,
  DetailSheetSettingsMenu,
  DetailSheetTabBar,
  DetailSheetTabPanel,
  EntityDetailSheetContent,
  EntityItemHost,
} from '@/components/shared';
import type { RelationCreatedEvent } from '@/components/shared/relation-picker';
import { useRegisterRelationCreated } from '@/components/shared/relation-picker/use-register-relation-created';
import { applyDealRelationCreated } from './apply-deal-relation-created';
import { Sheet } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { Dispatch, RefObject, SetStateAction } from 'react';
import { DealPipelineStages } from './DealPipelineStages';
import { DealExceptionOrderDialog } from './DealExceptionOrderDialog';
import { DealGeneralTab } from './DealGeneralTab';
import { DealHistoryTab } from './DealHistoryTab';
import { DealInvoiceTab } from './DealInvoiceTab';
import { DealCallsTab } from './DealCallsTab';
import { DealTasksTab } from './DealTasksTab';
import { ClickToCallButton } from '@/features/crm/calls/ClickToCallButton';
import type { Deal } from '@/lib/api/deals';
import { CRM_OPEN_DEAL_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import {
  DEAL_DETAIL_SHEET_RAIL_ANCHOR_CLASS,
  DEAL_DETAIL_SHEET_WIDTH_CLASS,
} from '@/features/crm/constants/deal-sheet-layout';
import type { DealSheetBlockerIntent } from '@/features/shared/blocker-actions';
import type { ApiFieldError } from '@/lib/api-errors';
import {
  buildDealGeneralPatch,
  createDealGeneralDraft,
  isDealGeneralDirty,
  type DealGeneralDraft,
} from './deal-general-form-state';
import { CrmSheetEntityHeader } from './CrmSheetEntityHeader';
import { DealSheetQuickActions } from './DealSheetQuickActions';
import { DealSheetCreateDialogs } from './DealSheetCreateDialogs';
import { buildDealDetailSheetTabs } from './build-deal-detail-sheet-tabs';
import { canOpenDealCreateInvoiceDialog } from '@/features/crm/utils/deal-invoice-eligibility';
import { useTaskCreatorId } from '@/features/tasks/use-task-creator-id';
import { getDealDisplayTitle } from '../utils/crm-entity-display';
import { getDealTypePresentation } from '@/lib/deal-type-visual';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';

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
  onPermanentDelete?: (id: string) => void;
  onRefresh?: () => void;
  onOpenDeal?: (id: string) => void;
  /** One-shot navigation from CRM stage gate shortcuts; consumed via callback. */
  blockerNavigation?: DealSheetBlockerNavigation | null;
  onBlockerNavigationConsumed?: () => void;
  stageGateHighlight?: DealSheetStageGateHighlight | null;
  onOpenChangeComplete?: (open: boolean) => void;
  /** Stack above an already-open entity sheet (e.g. Delivery detail). */
  forceNestedBackdrop?: boolean;
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
  onPermanentDelete,
  onRefresh,
  onOpenDeal,
  blockerNavigation = null,
  onBlockerNavigationConsumed,
  stageGateHighlight = null,
  onOpenChangeComplete,
  forceNestedBackdrop = false,
}: DealSheetProps) {
  const { persistedValue: renderDeal, onOpenChangeComplete: clearRenderDeal } =
    useSheetPersistedValue(deal);
  const hostMounted = useSheetHostMounted(open, renderDeal);
  const handleOpenChangeComplete = useCallback(
    (nextOpen: boolean) => {
      clearRenderDeal(nextOpen);
      onOpenChangeComplete?.(nextOpen);
    },
    [clearRenderDeal, onOpenChangeComplete],
  );

  const [activeTab, setActiveTab] = useState('general');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [invoiceCreateOpen, setInvoiceCreateOpen] = useState(false);
  const [taskCreateOpen, setTaskCreateOpen] = useState(false);
  const [taskListRefreshSignal, setTaskListRefreshSignal] = useState(0);
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
    setInvoiceCreateOpen(true);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draft sync keyed on deal.id
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

  useEffect(() => {
    if (open) return;
    setInvoiceCreateOpen(false);
    setTaskCreateOpen(false);
  }, [open]);

  if (!hostMounted) return null;

  return (
    <EntityItemHost nested onEntityChanged={onRefresh}>
      <Sheet
        open={open}
        onOpenChange={onOpenChange}
        onOpenChangeComplete={handleOpenChangeComplete}
      >
        {!renderDeal ? (
          <EntityDetailSheetContent
            open={open}
            layout="full"
            forceNestedBackdrop={forceNestedBackdrop}
            contentClassName={DEAL_DETAIL_SHEET_WIDTH_CLASS}
            railAnchorClassName={DEAL_DETAIL_SHEET_RAIL_ANCHOR_CLASS}
          >
            <div className="text-muted-foreground flex items-center gap-2 p-5 text-sm">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading deal…
            </div>
          </EntityDetailSheetContent>
        ) : (
          <EntityDetailSheetContent
            open={open}
            layout="full"
            forceNestedBackdrop={forceNestedBackdrop}
            contentClassName={DEAL_DETAIL_SHEET_WIDTH_CLASS}
            railAnchorClassName={DEAL_DETAIL_SHEET_RAIL_ANCHOR_CLASS}
            sourcePageHref={`/crm/deals?${CRM_OPEN_DEAL_QUERY}=${encodeURIComponent(renderDeal.id)}`}
          >
            <DealSheetBody
              renderDeal={renderDeal}
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
              onInvoiceCreateOpenChange={setInvoiceCreateOpen}
              onTaskCreateOpenChange={setTaskCreateOpen}
              taskListRefreshSignal={taskListRefreshSignal}
              onStatusChange={onStatusChange}
              onRefresh={onRefresh}
              onOpenDeal={onOpenDeal}
              onRestore={onRestore}
              onPermanentDelete={onPermanentDelete}
              onMoveToTrash={onMoveToTrash}
              patchGeneralDraft={patchGeneralDraft}
              handleGeneralSave={handleGeneralSave}
              handleGeneralCancel={handleGeneralCancel}
              onOpenExceptionDialog={() => setExceptionDialogOpen(true)}
            />
          </EntityDetailSheetContent>
        )}
      </Sheet>
      {renderDeal ? (
        <>
          <DealExceptionOrderDialog
            dealId={renderDeal.id}
            open={exceptionDialogOpen}
            onOpenChange={setExceptionDialogOpen}
            onSuccess={() => {
              onRefresh?.();
            }}
          />
          <DealSheetCreateDialogs
            deal={renderDeal}
            invoiceCreateOpen={invoiceCreateOpen}
            onInvoiceCreateOpenChange={setInvoiceCreateOpen}
            taskCreateOpen={taskCreateOpen}
            onTaskCreateOpenChange={setTaskCreateOpen}
            onRefresh={onRefresh}
            onTaskCreated={() => setTaskListRefreshSignal((previous) => previous + 1)}
          />
        </>
      ) : null}
    </EntityItemHost>
  );
}

function DealSheetBody({
  renderDeal,
  isTrashView,
  activeTab,
  setActiveTab,
  editingName,
  nameValue,
  setNameValue,
  setEditingName,
  nameInputRef,
  generalDraft,
  generalDirty,
  generalError,
  gateRequiredFields,
  onInvoiceCreateOpenChange,
  onTaskCreateOpenChange,
  taskListRefreshSignal,
  onStatusChange,
  onRefresh,
  onOpenDeal,
  onRestore,
  onPermanentDelete,
  onMoveToTrash,
  patchGeneralDraft,
  handleGeneralSave,
  handleGeneralCancel,
  onOpenExceptionDialog,
}: {
  renderDeal: Deal;
  isTrashView: boolean;
  activeTab: string;
  setActiveTab: Dispatch<SetStateAction<string>>;
  editingName: boolean;
  nameValue: string;
  setNameValue: Dispatch<SetStateAction<string>>;
  setEditingName: Dispatch<SetStateAction<boolean>>;
  nameInputRef: RefObject<HTMLInputElement | null>;
  generalDraft: DealGeneralDraft | null;
  generalDirty: boolean;
  generalError: string | null;
  gateRequiredFields: ReadonlySet<string>;
  onInvoiceCreateOpenChange: (open: boolean) => void;
  onTaskCreateOpenChange: (open: boolean) => void;
  taskListRefreshSignal: number;
  onStatusChange: (id: string, status: string) => Promise<void>;
  onRefresh?: () => void;
  onOpenDeal?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPermanentDelete?: (id: string) => void;
  onMoveToTrash?: (id: string) => void;
  patchGeneralDraft: (partial: Partial<DealGeneralDraft>) => void;
  handleGeneralSave: () => void;
  handleGeneralCancel: () => void;
  onOpenExceptionDialog: () => void;
}) {
  const { creatorId, creatorReady } = useTaskCreatorId();
  const typeVisual = getDealTypePresentation(renderDeal.type);
  const taxStatus = renderDeal.taxStatus ?? 'TAX';
  const canCreateInvoice = !isTrashView && canOpenDealCreateInvoiceDialog(renderDeal, taxStatus);
  const canCreateTask = !isTrashView && (!creatorReady || Boolean(creatorId));
  const detailSheetTabs = useMemo(
    () =>
      buildDealDetailSheetTabs(TABS, {
        canCreateInvoice,
        canCreateTask,
        onCreateInvoice: () => onInvoiceCreateOpenChange(true),
        onCreateTask: () => onTaskCreateOpenChange(true),
      }),
    [canCreateInvoice, canCreateTask, onInvoiceCreateOpenChange, onTaskCreateOpenChange],
  );
  const headerTitle = generalDraft?.name?.trim() || getDealDisplayTitle(renderDeal);
  const TypeIcon = typeVisual.Icon;
  const canCreateExceptionOrder =
    !isTrashView &&
    renderDeal.status !== 'WON' &&
    renderDeal.status !== 'FAILED' &&
    (renderDeal.orders?.length ?? 0) === 0 &&
    (renderDeal.type === 'PRODUCT' ||
      renderDeal.type === 'EXTENSION' ||
      renderDeal.type === 'OUTSOURCE');

  const startEditing = () => {
    if (isTrashView) return;
    setNameValue(generalDraft?.name ?? renderDeal.name ?? '');
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
      setNameValue(generalDraft?.name ?? renderDeal.name ?? '');
    }
  };

  return (
    <>
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
          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
            <ClickToCallButton targetType="DEAL" targetId={renderDeal.id} hidden={isTrashView} />
            {!isTrashView ? (
              <DealSheetQuickActions
                deal={renderDeal}
                onRefresh={onRefresh}
                onCreateInvoice={() => onInvoiceCreateOpenChange(true)}
                onCreateTask={() => onTaskCreateOpenChange(true)}
              />
            ) : null}
            {isTrashView && onRestore ? (
              <DetailSheetSettingsMenu>
                <DropdownMenuItem onClick={() => onRestore(renderDeal.id)}>
                  <RotateCcw />
                  Restore
                </DropdownMenuItem>
                {onPermanentDelete ? (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onPermanentDelete(renderDeal.id)}
                  >
                    <Trash2 />
                    Delete permanently
                  </DropdownMenuItem>
                ) : null}
              </DetailSheetSettingsMenu>
            ) : onMoveToTrash || canCreateExceptionOrder ? (
              <DetailSheetSettingsMenu>
                {canCreateExceptionOrder ? (
                  <DropdownMenuItem onClick={onOpenExceptionDialog}>
                    <AlertTriangle />
                    Exception order
                  </DropdownMenuItem>
                ) : null}
                {onMoveToTrash ? (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onMoveToTrash(renderDeal.id)}
                  >
                    <Trash2 />
                    Move to Trash
                  </DropdownMenuItem>
                ) : null}
              </DetailSheetSettingsMenu>
            ) : null}
          </div>
        }
      />

      <div className="shrink-0 pb-3">
        <DealPipelineStages
          currentStatus={renderDeal.status}
          onStageClick={isTrashView ? () => {} : (key) => onStatusChange(renderDeal.id, key)}
        />
      </div>

      <DetailSheetTabBar
        tabs={detailSheetTabs}
        activeTab={activeTab}
        onTabChange={(value) => setActiveTab(value as (typeof TABS)[number]['value'])}
      />

      <ScrollArea className="min-h-0 flex-1">
        <div className="px-7 py-5">
          <DetailSheetTabPanel tabKey={activeTab}>
            {activeTab === 'general' && generalDraft ? (
              <DealGeneralTab
                deal={renderDeal}
                draft={generalDraft}
                patchDraft={patchGeneralDraft}
                formDisabled={isTrashView}
                onRefresh={onRefresh}
                onOpenDeal={onOpenDeal}
                gateRequiredFields={gateRequiredFields}
              />
            ) : null}
            {activeTab === 'history' && <DealHistoryTab />}
            {activeTab === 'invoice' && (
              <DealInvoiceTab deal={renderDeal} onCreateOpenChange={onInvoiceCreateOpenChange} />
            )}
            {activeTab === 'task' && (
              <DealTasksTab
                deal={renderDeal}
                onRefresh={onRefresh}
                onCreateOpenChange={onTaskCreateOpenChange}
                tasksRefreshSignal={taskListRefreshSignal}
              />
            )}
            {activeTab === 'calls' && <DealCallsTab dealId={renderDeal.id} />}
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
    </>
  );
}
