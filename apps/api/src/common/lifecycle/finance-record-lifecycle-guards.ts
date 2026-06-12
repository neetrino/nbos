import { ConflictException } from '@nestjs/common';
import type { ExpenseStatusEnum, InvoiceMoneyStatusEnum, OrderStatusEnum } from '@nbos/database';

/** Profile D — draft-only hard delete for finance records with audit history. */

export function assertInvoiceDraftDeletable(input: {
  moneyStatus: InvoiceMoneyStatusEnum;
  paymentCount: number;
}): void {
  if (input.paymentCount > 0) {
    throw new ConflictException(
      'Invoice has payments recorded. Cancel the invoice instead of deleting it.',
    );
  }
  if (input.moneyStatus !== 'NEW') {
    throw new ConflictException(
      'Only draft invoices (moneyStatus NEW) can be deleted. Cancel the invoice instead.',
    );
  }
}

export function assertInvoiceCancellable(input: { moneyStatus: InvoiceMoneyStatusEnum }): void {
  if (input.moneyStatus === 'PAID') {
    throw new ConflictException('Paid invoices cannot be cancelled.');
  }
  if (input.moneyStatus === 'CANCELLED') {
    throw new ConflictException('Invoice is already cancelled.');
  }
}

export function assertOrderDraftDeletable(input: {
  status: OrderStatusEnum;
  invoiceCount: number;
}): void {
  if (input.invoiceCount > 0) {
    throw new ConflictException('Orders with invoice cards cannot be deleted.');
  }
  if (input.status !== 'PENDING_PAYMENT') {
    throw new ConflictException(
      'Only draft orders (PENDING_PAYMENT) without invoices can be deleted.',
    );
  }
}

export function assertExpenseDraftDeletable(input: {
  status: ExpenseStatusEnum;
  paymentCount: number;
  hasSalaryLine: boolean;
  hasPartnerPayoutBatch: boolean;
}): void {
  if (input.hasSalaryLine || input.hasPartnerPayoutBatch) {
    throw new ConflictException(
      'Linked payroll or partner payout records prevent deleting this expense.',
    );
  }
  if (input.paymentCount > 0) {
    throw new ConflictException(
      'Expense has payments recorded. Cancel the expense instead of deleting it.',
    );
  }
  if (input.status !== 'PLANNED') {
    throw new ConflictException(
      'Only PLANNED expenses without payments can be deleted. Cancel the expense instead.',
    );
  }
}

export function assertExpenseCancellable(input: { status: ExpenseStatusEnum }): void {
  if (input.status === 'PAID') {
    throw new ConflictException('Paid expenses cannot be cancelled.');
  }
  if (input.status === 'CANCELLED') {
    throw new ConflictException('Expense is already cancelled.');
  }
}

export function assertExpensePlanEmptyDeletable(expenseCardCount: number): void {
  if (expenseCardCount > 0) {
    throw new ConflictException(
      'Cannot delete an expense plan with linked expense cards. Cancel cards or turn off auto-generate on the plan.',
    );
  }
}
