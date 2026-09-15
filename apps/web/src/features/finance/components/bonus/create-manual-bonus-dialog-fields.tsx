'use client';

import { Receipt, UserCog } from 'lucide-react';
import { FormFieldRow, InlineField, RelationPickerField } from '@/components/shared';
import { FORM_FIELD_CELL_CLASS } from '@/components/shared/create-form';
import {
  DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS,
  DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS,
  DETAIL_SHEET_OUTLINED_LABEL_CLASS,
} from '@/components/shared/detail-sheet-classes';
import { NbosMonthPicker } from '@/components/shared/date-picker';
import {
  useEmployeeRelationSearch,
  useOrderRelationSearch,
} from '@/components/shared/relation-picker';
import {
  MANUAL_BONUS_CREATE_STATUSES,
  MANUAL_BONUS_TYPE_OPTIONS,
} from '@/features/finance/constants/manual-bonus-create';
import type { BonusStatus, BonusType } from '@/lib/api/bonus';

export function CreateManualBonusDialogFields({
  title,
  employeeId,
  employeeLabel,
  employeeAvatar,
  orderId,
  orderLabel,
  orderResolving,
  type,
  status,
  amount,
  payoutMonth,
  reason,
  loading,
  onTitleChange,
  onEmployeeSelect,
  onOrderSelect,
  onTypeChange,
  onStatusChange,
  onAmountChange,
  onPayoutMonthChange,
  onReasonChange,
}: {
  title: string;
  employeeId: string;
  employeeLabel: string | null;
  employeeAvatar: string | null;
  orderId: string;
  orderLabel: string | null;
  orderResolving: boolean;
  type: BonusType;
  status: BonusStatus;
  amount: string;
  payoutMonth: string;
  reason: string;
  loading: boolean;
  onTitleChange: (value: string) => void;
  onEmployeeSelect: (id: string, label: string, avatar?: string | null) => void;
  onOrderSelect: (id: string, label: string) => void;
  onTypeChange: (value: BonusType) => void;
  onStatusChange: (value: BonusStatus) => void;
  onAmountChange: (value: string) => void;
  onPayoutMonthChange: (value: string) => void;
  onReasonChange: (value: string) => void;
}) {
  const searchEmployees = useEmployeeRelationSearch();
  const searchOrders = useOrderRelationSearch();
  return (
    <>
      <p className="text-muted-foreground text-xs leading-snug">
        Manual bonus for any employee. Use Marketing type for marketing and support until automated
        KPI accrual ships. Active status makes the bonus eligible for payroll attach.
      </p>
      <InlineField
        variant="controlled"
        label="Title"
        type="text"
        value={title}
        disabled={loading}
        placeholder="e.g. Manual support bonus — launch"
        onValueChange={onTitleChange}
      />
      <RelationPickerField
        label="Employee"
        entityKind="employee"
        value={employeeId || null}
        selectionLabel={employeeLabel}
        selectionAvatar={employeeAvatar}
        icon={<UserCog size={12} />}
        disabled={loading}
        onSearch={searchEmployees}
        onSelect={onEmployeeSelect}
      />
      <RelationPickerField
        label="Order (funding anchor)"
        entityKind="order"
        value={orderId || null}
        selectionLabel={orderLabel}
        placeholder={orderResolving ? 'Resolving order…' : 'Search orders…'}
        icon={<Receipt size={12} />}
        disabled={loading || orderResolving}
        onSearch={searchOrders}
        onSelect={onOrderSelect}
      />
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label="Type"
          type="select"
          value={type}
          disabled={loading}
          options={[...MANUAL_BONUS_TYPE_OPTIONS]}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(value) => value && onTypeChange(value as BonusType)}
        />
        <InlineField
          variant="controlled"
          label="Status"
          type="select"
          value={status}
          disabled={loading}
          options={[...MANUAL_BONUS_CREATE_STATUSES]}
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={(value) => value && onStatusChange(value as BonusStatus)}
        />
      </FormFieldRow>
      <FormFieldRow>
        <InlineField
          variant="controlled"
          label="Amount"
          type="money"
          value={amount}
          disabled={loading}
          placeholder="0"
          className={FORM_FIELD_CELL_CLASS}
          onValueChange={onAmountChange}
        />
        <div className={FORM_FIELD_CELL_CLASS}>
          <div className={DETAIL_SHEET_OUTLINED_FIELD_WRAP_CLASS}>
            <span className={DETAIL_SHEET_OUTLINED_LABEL_CLASS}>Payout month</span>
            <div className={DETAIL_SHEET_OUTLINED_FIELD_SHELL_CLASS}>
              <NbosMonthPicker
                value={payoutMonth}
                disabled={loading}
                onChange={onPayoutMonthChange}
                aria-label="Payout month"
              />
            </div>
          </div>
        </div>
      </FormFieldRow>
      <InlineField
        variant="controlled"
        label="Reason"
        type="text"
        value={reason}
        disabled={loading}
        placeholder="Why this bonus is awarded"
        onValueChange={onReasonChange}
      />
    </>
  );
}
