import { Decimal } from '@nbos/database';

/** `totalPayable` for a salary line: base salary plus bonuses attached this run. */
export function computeSalaryLineTotalPayable(line: {
  baseSalary: Decimal;
  bonusesTotal: Decimal;
}): Decimal {
  return line.baseSalary.plus(line.bonusesTotal);
}
