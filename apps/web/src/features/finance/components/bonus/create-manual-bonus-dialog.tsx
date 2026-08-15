'use client';

import { useEffect, useState } from 'react';
import { Receipt, UserCog } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NbosMonthPicker } from '@/components/shared/date-picker';
import { RelationPickerField } from '@/components/shared';
import {
  useEmployeeRelationSearch,
  useOrderRelationSearch,
} from '@/components/shared/relation-picker';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  MANUAL_BONUS_CREATE_STATUSES,
  MANUAL_BONUS_DEFAULT_STATUS,
  MANUAL_BONUS_TYPE_OPTIONS,
} from '@/features/finance/constants/manual-bonus-create';
import { getApiErrorMessage } from '@/lib/api-errors';
import {
  bonusesApi,
  type BonusEntryListRow,
  type BonusStatus,
  type BonusType,
  type CreateBonusEntryPayload,
} from '@/lib/api/bonus';
import { ordersApi, type Order } from '@/lib/api/finance';

interface CreateManualBonusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: BonusEntryListRow) => void;
}

function currentPayrollMonthValue(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

const FORM_FIELD_GROUP_CLASS = 'space-y-2';

export function CreateManualBonusDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateManualBonusDialogProps) {
  const [loading, setLoading] = useState(false);
  const [orderResolving, setOrderResolving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState('');
  const [employeeLabel, setEmployeeLabel] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');
  const [orderLabel, setOrderLabel] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [type, setType] = useState<BonusType>('MARKETING');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<BonusStatus>(MANUAL_BONUS_DEFAULT_STATUS);
  const [payoutMonth, setPayoutMonth] = useState(currentPayrollMonthValue);

  const searchEmployees = useEmployeeRelationSearch();
  const searchOrders = useOrderRelationSearch();

  useEffect(() => {
    if (!open) return;
    setEmployeeId('');
    setEmployeeLabel(null);
    setOrderId('');
    setOrderLabel(null);
    setSelectedOrder(null);
    setType('MARKETING');
    setTitle('');
    setAmount('');
    setReason('');
    setStatus(MANUAL_BONUS_DEFAULT_STATUS);
    setPayoutMonth(currentPayrollMonthValue());
    setFormError(null);
    setOrderResolving(false);
  }, [open]);

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

  const handleOrderSelect = async (id: string, label: string) => {
    setOrderId(id);
    setOrderLabel(label);
    setOrderResolving(true);
    setFormError(null);
    try {
      const order = await ordersApi.getById(id);
      setSelectedOrder(order);
    } catch (caught) {
      setSelectedOrder(null);
      setFormError(getApiErrorMessage(caught, 'Order could not be loaded. Try again.'));
    } finally {
      setOrderResolving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || selectedOrder == null) return;

    setLoading(true);
    setFormError(null);
    try {
      const payload: CreateBonusEntryPayload = {
        employeeId,
        orderId: selectedOrder.id,
        projectId: selectedOrder.projectId,
        type,
        title: title.trim(),
        reason: reason.trim(),
        amount: parsedAmount,
        percent: 0,
        status,
        earnedPeriod: payoutMonth.trim(),
        payoutMonth: payoutMonth.trim() ? `${payoutMonth.trim()}-01` : undefined,
      };
      const created = await bonusesApi.create(payload);
      onCreated(created);
      onOpenChange(false);
    } catch (caught) {
      setFormError(getApiErrorMessage(caught, 'Bonus could not be created. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create bonus</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-muted-foreground text-xs leading-snug">
            Manual bonus for any employee. Use Marketing type for marketing and support until
            automated KPI accrual ships. Active status makes the bonus eligible for payroll attach.
          </p>
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}
          <div className={FORM_FIELD_GROUP_CLASS}>
            <Label>Title *</Label>
            <Input
              value={title}
              disabled={loading}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Manual support bonus — launch"
            />
          </div>
          <RelationPickerField
            label="Employee *"
            entityKind="employee"
            value={employeeId || null}
            selectionLabel={employeeLabel}
            placeholder="Search employees…"
            icon={<UserCog size={12} />}
            disabled={loading}
            onSearch={searchEmployees}
            onSelect={(id, label) => {
              setEmployeeId(id);
              setEmployeeLabel(label);
            }}
          />
          <RelationPickerField
            label="Order (funding anchor) *"
            entityKind="order"
            value={orderId || null}
            selectionLabel={orderLabel}
            placeholder={orderResolving ? 'Resolving order…' : 'Search orders…'}
            icon={<Receipt size={12} />}
            disabled={loading || orderResolving}
            onSearch={searchOrders}
            onSelect={(id, label) => {
              void handleOrderSelect(id, label);
            }}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className={FORM_FIELD_GROUP_CLASS}>
              <Label>Type *</Label>
              <Select
                value={type}
                disabled={loading}
                onValueChange={(value) => {
                  if (value) setType(value as BonusType);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_BONUS_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={FORM_FIELD_GROUP_CLASS}>
              <Label>Status *</Label>
              <Select
                value={status}
                disabled={loading}
                onValueChange={(value) => {
                  if (value) setStatus(value as BonusStatus);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MANUAL_BONUS_CREATE_STATUSES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className={FORM_FIELD_GROUP_CLASS}>
              <Label>Amount *</Label>
              <Input
                inputMode="decimal"
                value={amount}
                disabled={loading}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className={FORM_FIELD_GROUP_CLASS}>
              <Label>Payout month *</Label>
              <NbosMonthPicker
                value={payoutMonth}
                disabled={loading}
                onChange={setPayoutMonth}
                aria-label="Payout month"
              />
            </div>
          </div>
          <div className={FORM_FIELD_GROUP_CLASS}>
            <Label>Reason *</Label>
            <Input
              value={reason}
              disabled={loading}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why this bonus is awarded"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !canSubmit}>
              {loading ? 'Creating…' : 'Create bonus'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
