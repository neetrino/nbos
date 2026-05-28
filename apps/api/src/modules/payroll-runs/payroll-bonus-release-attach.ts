import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal, type PayrollRunStatusEnum, type TransactionClient } from '@nbos/database';
import { recalculatePayrollRunTotalsFromSalaryLines } from './payroll-run-line-totals';
import { resolveSalaryLineStatus } from './payroll-salary-line-ledger-sync';
import { resolveCompensationPayrollPolicyForEmployee } from '../compensation-profiles/resolve-compensation-payroll-policy';
import { assertSalesBonusReadyForPayrollAttach } from '../bonus/resolve-sales-bonus-payable-at-attach';
import { applyPendingPayrollCarryOver } from './payroll-bonus-carry-over-apply';
import { applyPayrollBonusCap } from './payroll-bonus-cap';
import type { CompensationPayrollPolicy } from '../compensation-profiles/resolve-compensation-payroll-policy';
import { computePayrollIncludedBonusAmount } from './sales-kpi-payroll-payout';
import type { PayrollAttachNotifyEvent } from './payroll-attach-notify.types';

const ATTACH_ALLOWED: PayrollRunStatusEnum[] = ['DRAFT', 'REVIEW'];

/** Minimal DB surface for attaching bonus releases (transaction or full client). */
export type BonusReleaseAttachTx = Pick<
  TransactionClient,
  | 'payrollRun'
  | 'bonusRelease'
  | 'bonusEntry'
  | 'salaryLine'
  | 'compensationProfile'
  | 'kpiPolicy'
  | 'kpiResult'
  | 'payment'
>;

export interface AttachBonusReleasesParams {
  payrollRunId: string;
  releaseIds: string[];
}

function computeLineTotalPayable(line: {
  baseSalary: Decimal;
  bonusesTotal: Decimal;
  adjustmentsTotal: Decimal;
  deductionsTotal: Decimal;
}): Decimal {
  return line.baseSalary
    .plus(line.bonusesTotal)
    .plus(line.adjustmentsTotal)
    .minus(line.deductionsTotal);
}

/**
 * Moves approved bonus releases into a draft/review payroll run: bumps `SalaryLine.bonusesTotal`
 * and marks each release `INCLUDED_IN_PAYROLL`.
 */
export async function attachBonusReleasesToPayrollRun(
  tx: BonusReleaseAttachTx,
  params: AttachBonusReleasesParams,
): Promise<PayrollAttachNotifyEvent[]> {
  const notifyEvents: PayrollAttachNotifyEvent[] = [];
  const { payrollRunId, releaseIds } = params;
  if (releaseIds.length === 0) {
    throw new BadRequestException('releaseIds must be non-empty');
  }

  const uniqueIds = [...new Set(releaseIds)];

  const run = await tx.payrollRun.findUnique({
    where: { id: payrollRunId },
    select: {
      id: true,
      status: true,
      payrollMonth: true,
    },
  });
  if (!run) {
    throw new NotFoundException(`Payroll run ${payrollRunId} not found`);
  }
  if (!ATTACH_ALLOWED.includes(run.status)) {
    throw new BadRequestException(
      `Bonus releases can only be attached while the payroll run is DRAFT or REVIEW (current: ${run.status}).`,
    );
  }

  const releases = await tx.bonusRelease.findMany({
    where: { id: { in: uniqueIds } },
    select: {
      id: true,
      employeeId: true,
      amount: true,
      status: true,
      payrollRunId: true,
      bonusEntry: {
        select: { id: true, type: true, order: { select: { code: true } } },
      },
    },
  });
  if (releases.length !== uniqueIds.length) {
    throw new BadRequestException('One or more bonus release ids were not found.');
  }

  for (const rel of releases) {
    if (rel.status === 'INCLUDED_IN_PAYROLL' && rel.payrollRunId === payrollRunId) {
      continue;
    }
    if (rel.status !== 'APPROVED') {
      throw new BadRequestException(
        `Bonus release ${rel.id} is not in APPROVED status (current: ${rel.status}).`,
      );
    }
    if (rel.payrollRunId != null && rel.payrollRunId !== payrollRunId) {
      throw new BadRequestException(`Bonus release ${rel.id} is bound to a different payroll run.`);
    }
  }

  const releasesToAttach = releases.filter(
    (r) => !(r.status === 'INCLUDED_IN_PAYROLL' && r.payrollRunId === payrollRunId),
  );
  if (releasesToAttach.length === 0) {
    await recalculatePayrollRunTotalsFromSalaryLines(tx, payrollRunId);
    return notifyEvents;
  }

  const payrollPolicyByEmployee = new Map<string, CompensationPayrollPolicy>();
  const carryAppliedEmployees = new Set<string>();

  for (const rel of releasesToAttach) {
    let line = await tx.salaryLine.findUnique({
      where: {
        payrollRunId_employeeId: { payrollRunId, employeeId: rel.employeeId },
      },
      select: {
        id: true,
        compensationProfileId: true,
        baseSalary: true,
        bonusesTotal: true,
        adjustmentsTotal: true,
        deductionsTotal: true,
        paidAmount: true,
        payrollCarryAppliedAmount: true,
      },
    });
    if (!line) {
      throw new BadRequestException(
        `No salary line for employee ${rel.employeeId} in this payroll run; seed or add the line first.`,
      );
    }

    let payrollPolicy = payrollPolicyByEmployee.get(rel.employeeId);
    if (payrollPolicy == null) {
      payrollPolicy = await resolveCompensationPayrollPolicyForEmployee(
        tx,
        rel.employeeId,
        run.payrollMonth,
      );
      payrollPolicyByEmployee.set(rel.employeeId, payrollPolicy);
    }

    if (rel.bonusEntry.type === 'SALES') {
      await assertSalesBonusReadyForPayrollAttach(tx, {
        bonusEntryId: rel.bonusEntry.id,
        payrollMonth: run.payrollMonth,
        payrollPolicy,
      });
    }

    if (!carryAppliedEmployees.has(rel.employeeId)) {
      const carryAlreadyApplied =
        line.payrollCarryAppliedAmount != null && line.payrollCarryAppliedAmount.gt(0);
      if (!carryAlreadyApplied) {
        const carryApplied = await applyPendingPayrollCarryOver(tx, {
          employeeId: rel.employeeId,
          payrollMonth: run.payrollMonth,
          line,
          bonusCapBaseSalaryMultiplier: payrollPolicy.bonusCapBaseSalaryMultiplier,
        });
        if (carryApplied.gt(0)) {
          notifyEvents.push({
            kind: 'CARRY_APPLIED',
            employeeId: rel.employeeId,
            payrollRunId,
            payrollMonth: run.payrollMonth,
            amount: carryApplied,
          });
        }
      }
      carryAppliedEmployees.add(rel.employeeId);
      const refreshed = await tx.salaryLine.findUnique({
        where: {
          payrollRunId_employeeId: { payrollRunId, employeeId: rel.employeeId },
        },
        select: {
          id: true,
          compensationProfileId: true,
          baseSalary: true,
          bonusesTotal: true,
          adjustmentsTotal: true,
          deductionsTotal: true,
          paidAmount: true,
          payrollCarryAppliedAmount: true,
        },
      });
      if (refreshed) {
        line = refreshed;
      }
    }

    const releaseAmount = computePayrollIncludedBonusAmount({
      releaseAmount: rel.amount,
      bonusType: rel.bonusEntry.type,
      kpiFactor: new Decimal(1),
    });
    const capped = applyPayrollBonusCap({
      kpiScaledAmount: releaseAmount,
      currentBonusesTotal: line.bonusesTotal,
      baseSalary: line.baseSalary,
      bonusCapBaseSalaryMultiplier: payrollPolicy.bonusCapBaseSalaryMultiplier,
    });
    const included = capped.payrollIncludedAmount;

    const nextBonuses = line.bonusesTotal.plus(included);
    const nextTotal = computeLineTotalPayable({
      baseSalary: line.baseSalary,
      bonusesTotal: nextBonuses,
      adjustmentsTotal: line.adjustmentsTotal,
      deductionsTotal: line.deductionsTotal,
    });
    const paid = line.paidAmount;
    const nextRemaining = Decimal.max(new Decimal(0), nextTotal.minus(paid));
    const nextStatus = resolveSalaryLineStatus(nextTotal, paid);

    await tx.salaryLine.update({
      where: { id: line.id },
      data: {
        bonusesTotal: nextBonuses,
        totalPayable: nextTotal,
        remainingAmount: nextRemaining,
        status: nextStatus,
      },
    });

    await tx.bonusRelease.update({
      where: { id: rel.id },
      data: {
        status: 'INCLUDED_IN_PAYROLL',
        payrollRunId,
        payrollIncludedAmount: included,
        kpiBurnedAmount: null,
        kpiBurnedReason: null,
        payrollCarryOverAmount: capped.payrollCarryOverAmount,
        payrollCarryOverRemaining: capped.payrollCarryOverAmount,
      },
    });

    const deferred = capped.payrollCarryOverAmount;
    if (deferred != null && deferred.gt(0)) {
      notifyEvents.push({
        kind: 'CARRY_DEFERRED',
        employeeId: rel.employeeId,
        releaseId: rel.id,
        orderCode: rel.bonusEntry.order.code,
        payrollMonth: run.payrollMonth,
        amount: deferred,
      });
    }
  }

  await recalculatePayrollRunTotalsFromSalaryLines(tx, payrollRunId);
  return notifyEvents;
}
