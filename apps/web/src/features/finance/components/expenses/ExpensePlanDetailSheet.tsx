'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  DetailSheetFormFooter,
  DetailSheetTabBar,
  DetailSheetTabPanel,
  EntityDetailSheetContent,
  ErrorState,
  LoadingState,
} from '@/components/shared';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet } from '@/components/ui/sheet';
import { expensePlansListWithOpenPlanHref } from '@/features/finance/constants/expense-plan-deep-link';
import { buildExpensePlanDetailSheetTabs } from '@/features/finance/components/expenses/build-expense-plan-detail-sheet-tabs';
import { ExpensePlanCardsTab } from '@/features/finance/components/expenses/ExpensePlanCardsTab';
import { ExpensePlanDetailSheetLifecycle } from '@/features/finance/components/expenses/ExpensePlanDetailSheetLifecycle';
import { ExpensePlanGeneralTab } from '@/features/finance/components/expenses/ExpensePlanGeneralTab';
import { ExpensePlanHistoryTab } from '@/features/finance/components/expenses/ExpensePlanHistoryTab';
import type { ExpensePlanDetailSheetTab } from '@/features/finance/components/expenses/expense-plan-detail-sheet-tabs';
import { GenerateExpenseCardFromPlanDialog } from '@/features/finance/components/expenses/GenerateExpenseCardFromPlanDialog';
import { useExpensePlanDetail } from '@/features/finance/hooks/use-expense-plan-detail';
import {
  buildExpensePlanGeneralPatch,
  createExpensePlanGeneralDraft,
  isExpensePlanGeneralDirty,
  type ExpensePlanGeneralDraft,
} from '@/features/finance/utils/expense-plan-general-form-state';
import { getApiErrorMessage } from '@/lib/api-errors';
import { expensePlansApi, type ExpensePlan } from '@/lib/api/expense-plans';
import { useSheetHostMounted, useSheetPersistedValue } from '@/hooks/use-sheet-persisted-value';

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
  const { persistedValue: sheetId, onOpenChangeComplete } = useSheetPersistedValue(planId);
  const hostMounted = useSheetHostMounted(open, sheetId);
  const activePlanId = open && sheetId ? sheetId : '';
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
    plan?.projectId,
    plan?.autoGenerate,
    plan?.status,
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

  const openGenerate = useCallback(() => setGenerateOpen(true), []);

  const detailSheetTabs = useMemo(
    () =>
      buildExpensePlanDetailSheetTabs({
        canGenerateCard: plan != null && !saving && plan.status === 'ACTIVE',
        onGenerateCard: openGenerate,
      }),
    [openGenerate, plan, saving],
  );

  if (!hostMounted) return null;

  const sourcePageHref = expensePlansListWithOpenPlanHref(sheetId ?? '');
  const displayName = generalDraft?.name.trim() || plan?.name || '';

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange} onOpenChangeComplete={onOpenChangeComplete}>
        <EntityDetailSheetContent
          open={open}
          layout="full"
          width="compact"
          sourcePageHref={sourcePageHref}
        >
          <div className="bg-background shrink-0 px-7 pt-5 pb-3">
            {loading && !plan ? (
              <p className="text-muted-foreground text-sm">Loading…</p>
            ) : plan ? (
              <ExpensePlanDetailSheetLifecycle
                plan={plan}
                displayName={displayName}
                actionsDisabled={saving}
                onPlanUpdated={(updated) => {
                  handlePlanChange(updated);
                  void fetchPlan();
                }}
                onPlanDeleted={onPlanDeleted}
                onClose={() => onOpenChange(false)}
              />
            ) : null}
          </div>

          <DetailSheetTabBar
            tabs={detailSheetTabs}
            activeTab={activeTab}
            onTabChange={(value) => setActiveTab(value as ExpensePlanDetailSheetTab)}
          />

          <ScrollArea className="min-h-0 flex-1">
            <div className="px-7 py-5">
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
                      formDisabled={saving || plan.status === 'CANCELLED'}
                    />
                  ) : null}
                  {activeTab === 'cards' ? (
                    <ExpensePlanCardsTab
                      plan={plan}
                      onGenerateClick={openGenerate}
                      generateDisabled={saving || plan.status === 'CANCELLED'}
                    />
                  ) : null}
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
    </>
  );
}
