import { Decimal } from '@nbos/database';

import { moneyAmount } from './payroll-allocation-source-amounts';

export const P5_S3_SALARY = moneyAmount(new Decimal('300000'));
export const P5_S3_BONUS = moneyAmount(new Decimal('60000'));
export const P5_S3_EXPENSE = moneyAmount(P5_S3_SALARY.plus(P5_S3_BONUS));
export const P5_S3_PAYMENT = moneyAmount(new Decimal('320000'));
export const P5_S3_BONUS_CASH = moneyAmount(P5_S3_PAYMENT.minus(P5_S3_SALARY));
export const P5_S3_BONUS_UNPAID = moneyAmount(P5_S3_BONUS.minus(P5_S3_BONUS_CASH));
export const P5_S3_LINE_REMAINING = moneyAmount(P5_S3_EXPENSE.minus(P5_S3_PAYMENT));
export const P5_S3_RELEASE_ID = 'rel-60';
export const P5_S3_ENTRY_ID = 'be-rel-60';
export const P5_S3_EMPLOYEE_ID = 'emp-1';
export const P5_S3_RUN_ID = 'pr-1';
export const P5_S3_EXPENSE_ID = 'ex-1';
