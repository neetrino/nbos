import { Decimal } from '@nbos/database';

import { moneyAmount } from './payroll-allocation-source-amounts';

export const P6_S1_OLDER_UNPAID = moneyAmount(new Decimal('40000'));
export const P6_S1_PARTIAL_PLANNED = moneyAmount(new Decimal('200000'));
export const P6_S1_PARTIAL_PAID_CASH = moneyAmount(new Decimal('160000'));
export const P6_S1_PARTIAL_REMAINING = moneyAmount(
  P6_S1_PARTIAL_PLANNED.minus(P6_S1_PARTIAL_PAID_CASH),
);
export const P6_S1_INCLUDED_GROSS = moneyAmount(new Decimal('80000'));
export const P6_S1_INCLUDED_RELEASE = moneyAmount(new Decimal('60000'));
export const P6_S1_INCLUDED_PAID_CASH = moneyAmount(new Decimal('20000'));
export const P6_S1_INCLUDED_REMAINING = moneyAmount(
  P6_S1_INCLUDED_RELEASE.minus(P6_S1_INCLUDED_PAID_CASH),
);
export const P6_S1_CARRY = moneyAmount(new Decimal('100000'));
export const P6_S1_CARRY_USED = moneyAmount(new Decimal('60000'));
export const P6_S1_CARRY_AFTER_USE = moneyAmount(P6_S1_CARRY.minus(P6_S1_CARRY_USED));
export const P6_S1_RESIDUAL = moneyAmount(new Decimal('30000'));
export const P6_S1_PAID_SALARY = moneyAmount(new Decimal('300000'));

export const P6_S1_OLDER_ENTRY_ID = 'be-aug-unpaid';
export const P6_S1_PARTIAL_ENTRY_ID = 'be-partial';
export const P6_S1_PARTIAL_RELEASE_ID = 'rel-partial';
export const P6_S1_INCLUDED_ENTRY_ID = 'be-included';
export const P6_S1_INCLUDED_RELEASE_ID = 'rel-included';
export const P6_S1_CARRY_RELEASE_ID = 'rel-carry';
export const P6_S1_CARRY_ENTRY_ID = 'be-carry';
export const P6_S1_CLOSED_ENTRY_ID = 'be-closed';
export const P6_S1_CLOSED_RELEASE_ID = 'rel-closed';
export const P6_S1_PAID_LINE_ID = 'sl-paid-salary';
export const P6_S1_RESIDUAL_PAYMENT_ID = 'pay-residual';
export const P6_S1_OLDER_EMPLOYEE_ID = 'emp-aug';
export const P6_S1_PARTIAL_EMPLOYEE_ID = 'emp-partial';
export const P6_S1_INCLUDED_EMPLOYEE_ID = 'emp-included';
export const P6_S1_CARRY_EMPLOYEE_ID = 'emp-carry';
export const P6_S1_PARTIAL_CARRY_EMPLOYEE_ID = 'emp-carry-partial';
export const P6_S1_PARTIAL_CARRY_ENTRY_ID = 'be-carry-partial';
export const P6_S1_PARTIAL_CARRY_RELEASE_ID = 'rel-carry-partial';
export const P6_S1_USED_CARRY_EMPLOYEE_ID = 'emp-carry-used';
export const P6_S1_USED_CARRY_ENTRY_ID = 'be-carry-used';
export const P6_S1_USED_CARRY_RELEASE_ID = 'rel-carry-used';
export const P6_S1_CLOSED_EMPLOYEE_ID = 'emp-closed';
export const P6_S1_PAID_EMPLOYEE_ID = 'emp-paid';
export const P6_S1_RESIDUAL_EMPLOYEE_ID = 'emp-residual';
export const P6_S1_BURNED_EMPLOYEE_ID = 'emp-burned';
export const P6_S1_BURNED_ENTRY_ID = 'be-burned';
export const P6_S1_BURNED_RELEASE_ID = 'rel-burned';
export const P6_S1_SPLIT_PLANNED = moneyAmount(new Decimal('200000'));
export const P6_S1_SPLIT_INCLUDED_PAID = moneyAmount(new Decimal('30000'));
export const P6_S1_SPLIT_CARRY = moneyAmount(new Decimal('70000'));
export const P6_S1_SPLIT_UNRELEASED = moneyAmount(new Decimal('100000'));
export const P6_S1_SPLIT_OWED = moneyAmount(P6_S1_SPLIT_CARRY.plus(P6_S1_SPLIT_UNRELEASED));
export const P6_S1_SPLIT_REATTACH_INCLUDED = moneyAmount(new Decimal('40000'));
export const P6_S1_SPLIT_EMPLOYEE_ID = 'emp-split';
export const P6_S1_SPLIT_ENTRY_ID = 'be-split';
export const P6_S1_SPLIT_RELEASE_A = 'rel-split-a';
export const P6_S1_SPLIT_RELEASE_B = 'rel-split-b';
export const P6_S1_REATTACH_EMPLOYEE_ID = 'emp-split-reattach';
export const P6_S1_REATTACH_ENTRY_ID = 'be-split-reattach';
export const P6_S1_REATTACH_RELEASE_A = 'rel-split-reattach-a';
export const P6_S1_REATTACH_RELEASE_B = 'rel-split-reattach-b';
