'use client';

import { type FormEvent } from 'react';
import { CreateFormDialog } from '@/components/shared';
import { ReplaceAssigneeComponentList } from './replace-assignee-component-list';
import { ReplaceAssigneeFields } from './replace-assignee-fields';
import { UNSELECTED_EMPLOYEE_ID, UNSELECTED_ROLE } from './replace-assignee.constants';
import { submitEmployeeReplacement } from './replace-assignee-submit';
import { useReplaceAssigneeDialog } from './use-replace-assignee-dialog';

export function ReplaceAssigneeDialog({
  open,
  onOpenChange,
  configurationId,
  onReplaced,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configurationId: string;
  onReplaced: () => void;
}) {
  return (
    <ReplaceAssigneeDialogSession
      key={open ? 'open' : 'closed'}
      open={open}
      onOpenChange={onOpenChange}
      configurationId={configurationId}
      onReplaced={onReplaced}
    />
  );
}

function ReplaceAssigneeDialogSession({
  open,
  onOpenChange,
  configurationId,
  onReplaced,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configurationId: string;
  onReplaced: () => void;
}) {
  const dialog = useReplaceAssigneeDialog(configurationId);
  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={dialog.t('replaceAssignee.title')}
      description={dialog.t('replaceAssignee.description')}
      error={dialog.formError}
      submitting={dialog.submitting}
      canSubmit={dialog.canSubmit}
      submitLabel={dialog.t('replaceAssignee.submit')}
      submittingLabel={dialog.t('replaceAssignee.submitting')}
      cancelLabel={dialog.tCommon('cancel')}
      onSubmit={(event) =>
        void submitDialog(event, dialog, configurationId, onReplaced, onOpenChange)
      }
    >
      <ReplaceAssigneeDialogBody dialog={dialog} />
    </CreateFormDialog>
  );
}

function ReplaceAssigneeDialogBody({
  dialog,
}: {
  dialog: ReturnType<typeof useReplaceAssigneeDialog>;
}) {
  return (
    <>
      <ReplaceAssigneeFields
        roleKey={dialog.roleKey}
        holders={dialog.holders}
        fromEmployeeId={dialog.fromEmployeeId}
        toEmployeeId={dialog.toEmployeeId}
        toEmployeeLabel={dialog.toEmployeeLabel}
        toEmployeeAvatar={dialog.toEmployeeAvatar}
        reason={dialog.reason}
        disabled={dialog.submitting}
        onRoleChange={(nextRole) => {
          dialog.setRoleKey(nextRole);
          dialog.setFromEmployeeId(UNSELECTED_EMPLOYEE_ID);
        }}
        onFromEmployeeChange={dialog.setFromEmployeeId}
        onIncomingSelect={dialog.selectIncoming}
        onIncomingClear={dialog.clearIncoming}
        onReasonChange={dialog.setReason}
      />
      <ReplaceAssigneePlanSection dialog={dialog} />
    </>
  );
}

function ReplaceAssigneePlanSection({
  dialog,
}: {
  dialog: ReturnType<typeof useReplaceAssigneeDialog>;
}) {
  if (dialog.planState.loading) {
    return (
      <p className="text-muted-foreground text-sm">{dialog.t('replaceAssignee.planLoading')}</p>
    );
  }
  if (dialog.roleKey === UNSELECTED_ROLE) {
    return null;
  }
  if (dialog.fromEmployeeId === UNSELECTED_EMPLOYEE_ID) {
    return (
      <p className="text-muted-foreground text-sm">{dialog.t('replaceAssignee.pickOutgoing')}</p>
    );
  }
  if (dialog.heldComponents.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        {dialog.t('replaceAssignee.noHeldComponents')}
      </p>
    );
  }
  return (
    <ReplaceAssigneeComponentList
      components={dialog.heldComponents}
      shares={dialog.planState.shares}
      outgoingName={dialog.outgoingName}
      incomingName={dialog.incomingName}
      fromEmployeeId={dialog.fromEmployeeId}
      disabled={dialog.submitting || dialog.planState.plan === null}
      onSharesChange={dialog.planState.setShares}
    />
  );
}

async function submitDialog(
  event: FormEvent,
  dialog: ReturnType<typeof useReplaceAssigneeDialog>,
  configurationId: string,
  onReplaced: () => void,
  onOpenChange: (open: boolean) => void,
): Promise<void> {
  event.preventDefault();
  if (!dialog.canSubmit) {
    return;
  }
  dialog.setSubmitting(true);
  dialog.planState.setError(null);
  try {
    const result = await submitEmployeeReplacement({
      configurationId,
      form: dialog.form,
      fallback: dialog.t('replaceAssignee.submitFailed'),
      reloadPlan: dialog.planState.reload,
    });
    if (result === 'replaced') {
      onOpenChange(false);
      onReplaced();
      return;
    }
    if (result === 'conflict') {
      dialog.planState.setError(dialog.t('replaceAssignee.conflict'));
      return;
    }
    dialog.planState.setError(result.error);
  } finally {
    dialog.setSubmitting(false);
  }
}
