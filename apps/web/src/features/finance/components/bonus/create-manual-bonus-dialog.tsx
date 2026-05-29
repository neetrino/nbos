'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MANUAL_BONUS_CREATE_STATUSES,
  MANUAL_BONUS_DEFAULT_STATUS,
  MANUAL_BONUS_EMPLOYEES_PAGE_SIZE,
  MANUAL_BONUS_ORDERS_PAGE_SIZE,
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
import { employeesApi, type Employee } from '@/lib/api/employees';

interface CreateManualBonusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (created: BonusEntryListRow) => void;
}

function currentPayrollMonthValue(): string {
  const now = new Date();
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function employeeLabel(employee: Employee): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

function orderLabel(order: Order): string {
  return `${order.code} · ${order.project.code}`;
}

export function CreateManualBonusDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateManualBonusDialogProps) {
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const [employeeId, setEmployeeId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [type, setType] = useState<BonusType>('MARKETING');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<BonusStatus>(MANUAL_BONUS_DEFAULT_STATUS);
  const [payoutMonth, setPayoutMonth] = useState(currentPayrollMonthValue);

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === orderId) ?? null,
    [orderId, orders],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setEmployeesLoading(true);
    void employeesApi
      .getAll({ page: 1, pageSize: MANUAL_BONUS_EMPLOYEES_PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setEmployees(res.items);
      })
      .catch(() => {
        if (!cancelled) setEmployees([]);
      })
      .finally(() => {
        if (!cancelled) setEmployeesLoading(false);
      });
    setOrdersLoading(true);
    void ordersApi
      .getAll({ page: 1, pageSize: MANUAL_BONUS_ORDERS_PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setOrders(res.items);
      })
      .catch(() => {
        if (!cancelled) setOrders([]);
      })
      .finally(() => {
        if (!cancelled) setOrdersLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setEmployeeId('');
    setOrderId('');
    setType('MARKETING');
    setTitle('');
    setAmount('');
    setReason('');
    setStatus(MANUAL_BONUS_DEFAULT_STATUS);
    setPayoutMonth(currentPayrollMonthValue());
    setFormError(null);
  }, [open]);

  const parsedAmount = parseFloat(amount.replace(/\s/g, ''));
  const canSubmit =
    employeeId.length > 0 &&
    orderId.length > 0 &&
    title.trim().length > 0 &&
    reason.trim().length > 0 &&
    selectedOrder != null &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0;

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
        <p className="text-muted-foreground text-xs leading-snug">
          Manual bonus for any employee. Use Marketing type for marketing and support until
          automated KPI accrual ships. Active status makes the bonus eligible for payroll attach.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          {formError ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}
          <div>
            <Label>Title *</Label>
            <Input
              value={title}
              disabled={loading}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Manual support bonus — launch"
            />
          </div>
          <div>
            <Label>Employee *</Label>
            <select
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              value={employeeId}
              disabled={loading || employeesLoading}
              onChange={(e) => setEmployeeId(e.target.value)}
            >
              <option value="">Select employee…</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employeeLabel(employee)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Order (funding anchor) *</Label>
            <select
              className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
              value={orderId}
              disabled={loading || ordersLoading}
              onChange={(e) => setOrderId(e.target.value)}
            >
              <option value="">Select order…</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {orderLabel(order)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type *</Label>
              <select
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={type}
                disabled={loading}
                onChange={(e) => setType(e.target.value as BonusType)}
              >
                {MANUAL_BONUS_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Amount *</Label>
              <Input
                inputMode="decimal"
                value={amount}
                disabled={loading}
                placeholder="0"
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Reason *</Label>
            <Input
              value={reason}
              disabled={loading}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why this manual bonus is granted"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <select
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={status}
                disabled={loading}
                onChange={(e) => setStatus(e.target.value as BonusStatus)}
              >
                {MANUAL_BONUS_CREATE_STATUSES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Earned month</Label>
              <Input
                type="month"
                value={payoutMonth}
                disabled={loading}
                onChange={(e) => setPayoutMonth(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit || loading}>
              {loading ? 'Creating…' : 'Create bonus'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
