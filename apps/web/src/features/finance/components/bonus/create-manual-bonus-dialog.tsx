'use client';

import { useState, type FormEvent } from 'react';
import { CreateFormDialog } from '@/components/shared';
import { MANUAL_BONUS_DEFAULT_STATUS } from '@/features/finance/constants/manual-bonus-create';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  bonusesApi,
  type BonusEntryListRow,
  type BonusStatus,
  type BonusType,
  type CreateBonusEntryPayload,
} from '@/lib/api/bonus';
import { ordersApi, type Order } from '@/lib/api/finance';
import { CreateManualBonusDialogFields } from './create-manual-bonus-dialog-fields';

interface CreateManualBonusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: BonusEntryListRow) => void;
}

function currentPayrollMonthValue(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function CreateManualBonusDialog(props: CreateManualBonusDialogProps) {
  return <CreateManualBonusDialogSession key={props.open ? 'open' : 'closed'} {...props} />;
}

function CreateManualBonusDialogSession({
  open,
  onOpenChange,
  onCreated,
}: CreateManualBonusDialogProps) {
  const [loading, setLoading] = useState(false);
  const [orderResolving, setOrderResolving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState('');
  const [employeeLabel, setEmployeeLabel] = useState<string | null>(null);
  const [employeeAvatar, setEmployeeAvatar] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');
  const [orderLabel, setOrderLabel] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [type, setType] = useState<BonusType>('MARKETING');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<BonusStatus>(MANUAL_BONUS_DEFAULT_STATUS);
  const [payoutMonth, setPayoutMonth] = useState(currentPayrollMonthValue);
  const parsedAmount = parseFloat(amount.replace(/\s/g, ''));
  const canSubmit =
    employeeId.length > 0 &&
    orderId.length > 0 &&
    title.trim().length > 0 &&
    reason.trim().length > 0 &&
    selectedOrder != null &&
    !orderResolving &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0;

  return (
    <CreateFormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Create bonus"
      error={formError}
      submitting={loading}
      canSubmit={canSubmit}
      submitLabel="Create bonus"
      submittingLabel="Creating…"
      cancelLabel="Cancel"
      onSubmit={(event) =>
        void submitManualBonus({
          event,
          canSubmit,
          selectedOrder,
          employeeId,
          type,
          title,
          reason,
          parsedAmount,
          status,
          payoutMonth,
          setLoading,
          setFormError,
          onCreated,
          onOpenChange,
        })
      }
    >
      <CreateManualBonusDialogFields
        title={title}
        employeeId={employeeId}
        employeeLabel={employeeLabel}
        employeeAvatar={employeeAvatar}
        orderId={orderId}
        orderLabel={orderLabel}
        orderResolving={orderResolving}
        type={type}
        status={status}
        amount={amount}
        payoutMonth={payoutMonth}
        reason={reason}
        loading={loading}
        onTitleChange={setTitle}
        onEmployeeSelect={(id, label, avatar) => {
          setEmployeeId(id);
          setEmployeeLabel(label);
          setEmployeeAvatar(avatar?.trim() || null);
        }}
        onOrderSelect={(id, label) => {
          void resolveBonusOrder({
            id,
            label,
            setOrderId,
            setOrderLabel,
            setOrderResolving,
            setFormError,
            setSelectedOrder,
          });
        }}
        onTypeChange={setType}
        onStatusChange={setStatus}
        onAmountChange={setAmount}
        onPayoutMonthChange={setPayoutMonth}
        onReasonChange={setReason}
      />
    </CreateFormDialog>
  );
}

async function resolveBonusOrder(options: {
  id: string;
  label: string;
  setOrderId: (id: string) => void;
  setOrderLabel: (label: string) => void;
  setOrderResolving: (resolving: boolean) => void;
  setFormError: (error: string | null) => void;
  setSelectedOrder: (order: Order | null) => void;
}): Promise<void> {
  options.setOrderId(options.id);
  options.setOrderLabel(options.label);
  options.setOrderResolving(true);
  options.setFormError(null);
  try {
    options.setSelectedOrder(await ordersApi.getById(options.id));
  } catch (caught) {
    options.setSelectedOrder(null);
    options.setFormError(getApiErrorMessage(caught, 'Order could not be loaded. Try again.'));
  } finally {
    options.setOrderResolving(false);
  }
}

async function submitManualBonus(options: {
  event: FormEvent;
  canSubmit: boolean;
  selectedOrder: Order | null;
  employeeId: string;
  type: BonusType;
  title: string;
  reason: string;
  parsedAmount: number;
  status: BonusStatus;
  payoutMonth: string;
  setLoading: (loading: boolean) => void;
  setFormError: (error: string | null) => void;
  onCreated: (created: BonusEntryListRow) => void;
  onOpenChange: (open: boolean) => void;
}): Promise<void> {
  options.event.preventDefault();
  if (!options.canSubmit || options.selectedOrder == null) return;
  options.setLoading(true);
  options.setFormError(null);
  try {
    const payload: CreateBonusEntryPayload = {
      employeeId: options.employeeId,
      orderId: options.selectedOrder.id,
      projectId: options.selectedOrder.projectId,
      type: options.type,
      title: options.title.trim(),
      reason: options.reason.trim(),
      amount: options.parsedAmount,
      percent: 0,
      status: options.status,
      earnedPeriod: options.payoutMonth.trim(),
      payoutMonth: options.payoutMonth.trim() ? `${options.payoutMonth.trim()}-01` : undefined,
    };
    options.onCreated(await bonusesApi.create(payload));
    options.onOpenChange(false);
  } catch (caught) {
    options.setFormError(getApiErrorMessage(caught, 'Bonus could not be created. Try again.'));
  } finally {
    options.setLoading(false);
  }
}
