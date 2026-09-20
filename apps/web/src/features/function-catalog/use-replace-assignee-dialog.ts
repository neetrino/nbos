import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { ReplacementPlanHolderDto } from '@/lib/api/delivery-configurations';
import {
  canSubmitReplacement,
  componentsHeldBy,
  uniqueHolders,
  type ReplacementSubmitInput,
} from './replace-assignee-form';
import { UNSELECTED_EMPLOYEE_ID, UNSELECTED_ROLE } from './replace-assignee.constants';
import { useReplacementPlan } from './use-replacement-plan';

export function useReplaceAssigneeDialog(configurationId: string) {
  const t = useTranslations('hr.functionCatalog');
  const tCommon = useTranslations('common');
  const [roleKey, setRoleKey] = useState<string>(UNSELECTED_ROLE);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const outgoing = useOutgoingEmployee();
  const incoming = useIncomingEmployee();
  const planState = useReplacementPlan(configurationId, roleKey);
  const holders = useMemo(() => uniqueHolders(planState.plan?.components ?? []), [planState.plan]);
  useResetMissingOutgoing(holders, outgoing.fromEmployeeId, outgoing.setFromEmployeeId);
  const heldComponents = useMemo(
    () => componentsHeldBy(planState.plan?.components ?? [], outgoing.fromEmployeeId),
    [planState.plan, outgoing.fromEmployeeId],
  );
  const heldComponentIds = heldComponents.map((row) => row.componentId);
  const form: ReplacementSubmitInput = {
    roleKey,
    fromEmployeeId: outgoing.fromEmployeeId,
    toEmployeeId: incoming.toEmployeeId,
    reason,
    shares: planState.shares.filter((share) => heldComponentIds.includes(share.componentId)),
    componentIds: heldComponentIds,
    expectedRevision: planState.plan?.expectedRevision ?? null,
  };
  const sameEmployee =
    outgoing.fromEmployeeId !== UNSELECTED_EMPLOYEE_ID &&
    outgoing.fromEmployeeId === incoming.toEmployeeId;
  return {
    t,
    tCommon,
    roleKey,
    reason,
    submitting,
    setSubmitting,
    holders,
    heldComponents,
    planState,
    form,
    canSubmit:
      canSubmitReplacement(form) && !planState.loading && !submitting && planState.plan !== null,
    formError: sameEmployee ? t('replaceAssignee.sameEmployee') : planState.error,
    outgoingName: holderName(
      holders,
      outgoing.fromEmployeeId,
      t('replaceAssignee.outgoingPlaceholder'),
    ),
    incomingName: incoming.toEmployeeLabel ?? t('replaceAssignee.incomingPlaceholder'),
    setRoleKey,
    setReason,
    ...outgoing,
    ...incoming,
  };
}

function useOutgoingEmployee() {
  const [fromEmployeeId, setFromEmployeeId] = useState<string>(UNSELECTED_EMPLOYEE_ID);
  return { fromEmployeeId, setFromEmployeeId };
}

function useIncomingEmployee() {
  const [toEmployeeId, setToEmployeeId] = useState<string>(UNSELECTED_EMPLOYEE_ID);
  const [toEmployeeLabel, setToEmployeeLabel] = useState<string | null>(null);
  const [toEmployeeAvatar, setToEmployeeAvatar] = useState<string | null>(null);
  return {
    toEmployeeId,
    toEmployeeLabel,
    toEmployeeAvatar,
    selectIncoming(id: string, label: string, avatar?: string) {
      setToEmployeeId(id);
      setToEmployeeLabel(label);
      setToEmployeeAvatar(avatar?.trim() || null);
    },
    clearIncoming() {
      setToEmployeeId(UNSELECTED_EMPLOYEE_ID);
      setToEmployeeLabel(null);
      setToEmployeeAvatar(null);
    },
  };
}

function useResetMissingOutgoing(
  holders: readonly ReplacementPlanHolderDto[],
  fromEmployeeId: string,
  setFromEmployeeId: (employeeId: string) => void,
): void {
  useEffect(() => {
    if (fromEmployeeId === UNSELECTED_EMPLOYEE_ID) {
      return;
    }
    if (holders.some((holder) => holder.employeeId === fromEmployeeId)) {
      return;
    }
    setFromEmployeeId(UNSELECTED_EMPLOYEE_ID);
  }, [fromEmployeeId, holders, setFromEmployeeId]);
}

function holderName(
  holders: readonly ReplacementPlanHolderDto[],
  employeeId: string,
  fallback: string,
): string {
  return holders.find((holder) => holder.employeeId === employeeId)?.employeeName ?? fallback;
}
