'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/shared';
import { ExpensePlanCancelDialog } from '@/features/finance/components/expenses/ExpensePlanCancelDialog';
import { ExpensePlanDetailSheetHeader } from '@/features/finance/components/expenses/ExpensePlanDetailSheetHeader';
import { getApiErrorMessage } from '@/lib/api-errors';
import { expensePlansApi, type ExpensePlan } from '@/lib/api/expense-plans';

interface ExpensePlanDetailSheetLifecycleProps {
  plan: ExpensePlan;
  displayName: string;
  actionsDisabled?: boolean;
  onPlanUpdated?: (plan: ExpensePlan) => void;
  onPlanDeleted?: (planId: string) => void;
  onClose: () => void;
}

export function ExpensePlanDetailSheetLifecycle({
  plan,
  displayName,
  actionsDisabled = false,
  onPlanUpdated,
  onPlanDeleted,
  onClose,
}: ExpensePlanDetailSheetLifecycleProps) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const busy = actionsDisabled || statusSaving;

  const handleDeletePlan = useCallback(async () => {
    try {
      await expensePlansApi.delete(plan.id);
      toast.success('Expense plan deleted.');
      onPlanDeleted?.(plan.id);
      onClose();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not delete expense plan.'));
    }
  }, [onClose, onPlanDeleted, plan.id]);

  const handleCancelPlan = useCallback(async () => {
    setStatusSaving(true);
    try {
      const updated = await expensePlansApi.updateStatus(plan.id, 'CANCELLED');
      onPlanUpdated?.(updated);
      toast.success('Expense plan stopped. Future cards will not be created.');
      setCancelOpen(false);
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not stop expense plan.'));
    } finally {
      setStatusSaving(false);
    }
  }, [onPlanUpdated, plan.id]);

  const handleResumePlan = useCallback(async () => {
    setStatusSaving(true);
    try {
      const updated = await expensePlansApi.updateStatus(plan.id, 'ACTIVE');
      onPlanUpdated?.(updated);
      toast.success('Expense plan resumed.');
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, 'Could not resume expense plan.'));
    } finally {
      setStatusSaving(false);
    }
  }, [onPlanUpdated, plan.id]);

  return (
    <>
      <ExpensePlanDetailSheetHeader
        plan={plan}
        displayName={displayName}
        actionsDisabled={busy}
        onCancelClick={() => setCancelOpen(true)}
        onResumeClick={() => void handleResumePlan()}
        onDeleteClick={() => setDeleteOpen(true)}
      />
      <ExpensePlanCancelDialog
        plan={plan}
        open={cancelOpen}
        isSubmitting={statusSaving}
        onOpenChange={setCancelOpen}
        onConfirm={handleCancelPlan}
        forceNestedBackdrop
      />
      <DeleteConfirmDialog
        level="simple"
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        itemName={plan.name}
        title="Delete plan?"
        description="Only unused plans can be deleted. Linked cards keep running; stop the plan instead when history must stay."
        forceNestedBackdrop
        onConfirm={async () => {
          setDeleteOpen(false);
          await handleDeletePlan();
        }}
      />
    </>
  );
}
