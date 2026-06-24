'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import {
  DetailSheetFormFooter,
  DetailSheetTabBar,
  DetailSheetTabPanel,
  EntityDetailSheetContent,
  DeleteConfirmDialog,
  ErrorState,
  LoadingState,
  StatusBadge,
} from '@/components/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { expensePlansListWithOpenPlanHref } from '@/features/finance/constants/expense-plan-deep-link';
import { ExpensePlanCardsTab } from '@/features/finance/components/expenses/ExpensePlanCardsTab';
import { ExpensePlanGeneralTab } from '@/features/finance/components/expenses/ExpensePlanGeneralTab';
import { ExpensePlanHistoryTab } from '@/features/finance/components/expenses/ExpensePlanHistoryTab';
import {
  EXPENSE_PLAN_DETAIL_SHEET_TABS,
  type ExpensePlanDetailSheetTab,
} from '@/features/finance/components/expenses/expense-plan-detail-sheet-tabs';
import { GenerateExpenseCardFromPlanDialog } from '@/features/finance/components/expenses/GenerateExpenseCardFromPlanDialog';
import { useExpensePlanDetail } from '@/features/finance/hooks/use-expense-plan-detail';
import {
  buildExpensePlanGeneralPatch,
  createExpensePlanGeneralDraft,
  isExpensePlanGeneralDirty,
  type ExpensePlanGeneralDraft,
} from '@/features/finance/utils/expense-plan-general-form-state';
import { expensePlanFrequencyLabel } from '@/features/finance/utils/expense-plan-display';
import { getApiErrorMessage } from '@/lib/api-errors';
import { expensePlansApi, type ExpensePlan } from '@/lib/api/expense-plans';

export interface ExpensePlanDetailSheetProps {
  planId: string | null;
  initialPlan?: ExpensePlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlanUpdated?: (plan: ExpensePlan) => void;
  onPlanDeleted?: (planId: string) => void;
}

export function ExpensePlanDetailSheet({
  planId,
  initialPlan = null,
  open,
  onOpenChange,
  onPlanUpdated,
  onPlanDeleted,
}: ExpensePlanDetailSheetProps) {
  const activePlanId = open && planId ? planId : '';
  const { plan, loading, error, fetchPlan } = useExpensePlanDetail(activePlanId, {
    open,
    initialPlan,
    isDirty: () => generalDirtyRef.current,
  });
  const [activeTab, setActiveTab] = useState<ExpensePlanDetailSheetTab>('general');
  const [generalDraft, setGeneralDraft] = useState<ExpensePlanGeneralDraft | null>(null);
  const [generalSnap, setGeneralSnap] = useState<ExpensePlanGeneralDraft | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const generalDirtyRef = useRef(false);

  useEffect(() => {
    if (!open) {
      setGenerateOpen(false);
      setActiveTab('general');
    }
  }, [open]);

  useEffect(() => {
    setActiveTab('general');
  }, [planId, open]);

  useLayoutEffect(() => {
    if (!plan) {
      setGeneralDraft(null);
      setGeneralSnap(null);
      return;
    }
    if (generalDirtyRef.current) return;
    const next = createExpensePlanGeneralDraft(plan);
    setGeneralDraft(next);
    setGeneralSnap(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- draft sync keyed on plan.id
  }, [
    plan?.id,
    plan?.name,
    plan?.amount,
    plan?.category,
    plan?.frequency,
    plan?.nextDueDate,
    plan?.provider,
    plan?.projectId,
    plan?.autoGenerate,
    plan?.notes,
  ]);

  const patchGeneralDraft = useCallback((partial: Partial<ExpensePlanGeneralDraft>) => {
    setGeneralDraft((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  const generalDirty =
    generalDraft != null &&
    generalSnap != null &&
    isExpensePlanGeneralDirty(generalDraft, generalSnap);
  generalDirtyRef.current = generalDirty;

  const handlePlanChange = useCallback(
    (updated: ExpensePlan) => {
      onPlanUpdated?.(updated);
      generalDirtyRef.current = false;
      const next = createExpensePlanGeneralDraft(updated);
      setGeneralDraft(next);
      setGeneralSnap(next);
    },
    [onPlanUpdated],
  );

  const handleGeneralSave = useCallback(() => {
    if (!plan || !generalDraft || !generalSnap) return;
    setGeneralError(null);
    const patch = buildExpensePlanGeneralPatch(generalSnap, generalDraft);
    if (Object.keys(patch).length === 0) return;

    const draftAtSave = generalDraft;
    const snapAtSave = generalSnap;
    setGeneralSnap({ ...draftAtSave });
    setSaving(true);

    void (async () => {
      try {
        const updated = await expensePlansApi.update(plan.id, patch);
        generalDirtyRef.current = false;
        handlePlanChange(updated);
        toast.success('Expense plan updated');
      } catch (caught) {
        setGeneralSnap(snapAtSave);
        setGeneralDraft(draftAtSave);
        setGeneralError(getApiErrorMessage(caught, 'Could not save expense plan changes.'));
      } finally {
        setSaving(false);
      }
    })();
  }, [generalDraft, generalSnap, handlePlanChange, plan]);

  const handleGeneralCancel = useCallback(() => {
    setGeneralError(null);
    if (generalSnap) setGeneralDraft({ ...generalSnap });
  }, [generalSnap]);

  const handleDeletePlan = useCallback(async () => {
    if (!plan) return;
    try {
      await expensePlansApi.delete(plan.id);
      toast.success('Expense plan deleted.');
      onPlanDeleted?.(plan.id);
      onOpenChange(false);
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not delete expense plan.'));
    }
  }, [onOpenChange, onPlanDeleted, plan]);

  if (!planId) return null;

  const sourcePageHref = expensePlansListWithOpenPlanHref(planId);
  const frequencyLabel = plan ? expensePlanFrequencyLabel(plan.frequency) : '';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          width="medium"
          sourcePageHref={sourcePageHref}
        >
          <div className="bg-background border-border shrink-0 border-b px-5 pt-5 pb-3">
            {loading && !plan ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : plan ? (
              <div className="min-w-0">
                <div className="inline-flex max-w-full min-w-0 flex-wrap items-center gap-2">
                  <CalendarDays className="text-muted-foreground size-5 shrink-0" aria-hidden />
                  <h2 className="text-foreground truncate text-xl font-bold tracking-tight">
                    {generalDraft?.name.trim() || plan.name}
                  </h2>
                  <StatusBadge
                    label={frequencyLabel}
                    variant="gray"
                    className="shrink-0 self-center"
                  />
                </div>
              </div>
            ) : null}
          </div>

          <DetailSheetTabBar
            tabs={EXPENSE_PLAN_DETAIL_SHEET_TABS}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as ExpensePlanDetailSheetTab)}
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-5 py-5">
              {loading && !plan ? (
                <LoadingState count={3} />
              ) : error ? (
                <ErrorState description={error} onRetry={() => void fetchPlan()} />
              ) : plan && generalDraft ? (
                <DetailSheetTabPanel tabKey={activeTab}>
                  {activeTab === 'general' ? (
                    <ExpensePlanGeneralTab
                      plan={plan}
                      draft={generalDraft}
                      patchDraft={patchGeneralDraft}
                      formDisabled={saving}
                      onGenerateClick={() => setGenerateOpen(true)}
                      onDeleteClick={() => setDeleteOpen(true)}
                    />
                  ) : null}
                  {activeTab === 'cards' ? <ExpensePlanCardsTab plan={plan} /> : null}
                  {activeTab === 'history' ? <ExpensePlanHistoryTab /> : null}
                </DetailSheetTabPanel>
              ) : null}
            </div>
          </ScrollArea>

          <DetailSheetFormFooter
            visible={activeTab === 'general' && Boolean(plan && generalDraft)}
            dirty={generalDirty}
            saving={saving}
            errorMessage={generalError}
            onSave={handleGeneralSave}
            onCancel={handleGeneralCancel}
          />
        </EntityDetailSheetContent>
      </Sheet>

      {plan ? (
        <GenerateExpenseCardFromPlanDialog
          plan={plan}
          open={generateOpen}
          onOpenChange={setGenerateOpen}
          onGenerated={() => void fetchPlan()}
        />
      ) : null}

      <DeleteConfirmDialog
        level="simple"
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={plan?.name ?? ''}
        title="Delete plan?"
        description="Linked expense cards keep running; only the plan link is cleared."
        forceNestedBackdrop
        onConfirm={async () => {
          setDeleteOpen(false);
          await handleDeletePlan();
        }}
      />
    </>
  );
}
