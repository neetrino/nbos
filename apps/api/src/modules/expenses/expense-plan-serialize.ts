import { BadRequestException } from '@nestjs/common';
import { Decimal } from '@nbos/database';

export function toExpensePlanAmountDecimal(amount: number): Decimal {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new BadRequestException('Amount must be a positive number');
  }
  return new Decimal(amount);
}

export function serializeExpensePlanRow<T extends { amount: Decimal | unknown }>(row: T) {
  return {
    ...row,
    amount: String(row.amount),
  };
}
