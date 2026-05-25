import { Decimal } from '@nbos/database';

export type PayrollAttachNotifyEvent =
  | {
      kind: 'CARRY_APPLIED';
      employeeId: string;
      payrollRunId: string;
      payrollMonth: string;
      amount: Decimal;
    }
  | {
      kind: 'CARRY_DEFERRED';
      employeeId: string;
      releaseId: string;
      orderCode: string;
      payrollMonth: string;
      amount: Decimal;
    };
