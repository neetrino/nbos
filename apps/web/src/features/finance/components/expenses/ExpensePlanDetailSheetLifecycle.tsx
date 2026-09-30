'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { DeleteConfirmDialog } from '@/components/shared';
import { ExpensePlanCancelDialog } from '@/features/finance/components/expenses/ExpensePlanCancelDialog';
import { ExpensePlanDetailSheetHeader } from '@/features/finance/components/expenses/ExpensePlanDetailSheetHeader';
import { useCommitEntityName } from '@/features/finance/hooks/use-commit-entity-name';
import { getApiErrorMessage } from '@/lib/api-errors';
import { expensePlansApi, type ExpensePlan } from '@/lib/api/expense-plans';
import { useExpensePlansT } from './expense-plan-message-keys';

interface ExpensePlanDetailSheetLifecycleProps {
  plan: ExpensePlan;
  displayName: string;
  actionsDisabled?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  onNameSaved?: (plan: ExpensePlan) => void;
  onPlanUpdated?: (plan: ExpensePlan) => void;
  onPlanDeleted?: (planId: string) => void;
  onClose: () => void;
}

export function ExpensePlanDetailSheetLifecycle({
  plan,
  displayName,
  actionsDisabled = false,
  canEdit = false,
  canDelete = false,
  onNameSaved,
  onPlanUpdated,
  onPlanDeleted,
  onClose,
}: ExpensePlanDetailSheetLifecycleProps) {
  const t = useExpensePlansT();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const busy = actionsDisabled || statusSaving;
  const commitName = useCommitEntityName({
    enabled: canEdit && !busy,
    save: (name) => expensePlansApi.update(plan.id, { name }),
    onSaved: (updated) => onNameSaved?.(updated),
    successMessage: t('toasts.updated'),
    errorMessage: t('errors.saveChanges'),
  });

  const handleDeletePlan = useCallback(async () => {
    try {
      await expensePlansApi.delete(plan.id);
      toast.success(t('toasts.deleted'));
      onPlanDeleted?.(plan.id);
      onClose();
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('errors.delete')));
    }
  }, [onClose, onPlanDeleted, plan.id, t]);

  const handleCancelPlan = useCallback(async () => {
    setStatusSaving(true);
    try {
      const updated = await expensePlansApi.updateStatus(plan.id, 'CANCELLED');
      onPlanUpdated?.(updated);
      toast.success(t('toasts.stopped'));
      setCancelOpen(false);
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('errors.stop')));
    } finally {
      setStatusSaving(false);
    }
  }, [onPlanUpdated, plan.id, t]);

  const handleResumePlan = useCallback(async () => {
    setStatusSaving(true);
    try {
      const updated = await expensePlansApi.updateStatus(plan.id, 'ACTIVE');
      onPlanUpdated?.(updated);
      toast.success(t('toasts.resumed'));
    } catch (caught) {
      toast.error(getApiErrorMessage(caught, t('errors.resume')));
    } finally {
      setStatusSaving(false);
    }
  }, [onPlanUpdated, plan.id, t]);

  return (
    <>
      <ExpensePlanDetailSheetHeader
        plan={plan}
        displayName={displayName}
        actionsDisabled={busy}
        canEdit={canEdit}
        canDelete={canDelete}
        canRename={canEdit && !busy}
        onRename={commitName}
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
        title={t('delete.title')}
        description={t('delete.description')}
        forceNestedBackdrop
        onConfirm={async () => {
          setDeleteOpen(false);
          await handleDeletePlan();
        }}
      />
    </>
  );
}
