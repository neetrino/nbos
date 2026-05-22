import type { BonusPoolEmployeeLine, BonusProductPoolRow } from '@/lib/api/bonus';

export const BONUS_POOL_EMPLOYEE_CSV_HEADERS = [
  'poolKey',
  'poolName',
  'projectCode',
  'employeeName',
  'role',
  'bonusTypes',
  'plannedAmount',
  'releasedAmount',
  'paidAmount',
  'remainingAmount',
  'suggestedReleaseAmount',
  'kpiGatePassed',
  'kpiHeldAdvisory',
] as const;

const CSV_UTF8_BOM = '\uFEFF';

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function boolCell(value: boolean | null): string {
  if (value === null) return '';
  return value ? 'yes' : 'no';
}

export function buildBonusPoolEmployeesCsvContent(
  pools: readonly BonusProductPoolRow[],
  linesByPoolKey: ReadonlyMap<string, readonly BonusPoolEmployeeLine[]>,
): string {
  const headerLine = BONUS_POOL_EMPLOYEE_CSV_HEADERS.join(',');
  const rows: string[] = [];

  for (const pool of pools) {
    const lines = linesByPoolKey.get(pool.poolKey) ?? [];
    for (const line of lines) {
      const cells = [
        pool.poolKey,
        pool.poolName,
        pool.projectCode,
        line.employeeName,
        line.role ?? '',
        line.bonusTypes.join(';'),
        line.plannedAmount,
        line.releasedAmount,
        line.paidAmount,
        line.remainingAmount,
        line.suggestedReleaseAmount ?? '',
        boolCell(line.kpiGatePassed),
        line.burnedAmount ?? '',
      ].map((c) => escapeCsvCell(String(c)));
      rows.push(cells.join(','));
    }
  }

  if (rows.length === 0) {
    return headerLine;
  }
  return `${headerLine}\r\n${rows.join('\r\n')}`;
}

export function downloadBonusPoolEmployeesCsv(
  pools: readonly BonusProductPoolRow[],
  linesByPoolKey: ReadonlyMap<string, readonly BonusPoolEmployeeLine[]>,
): void {
  const content = buildBonusPoolEmployeesCsvContent(pools, linesByPoolKey);
  const dateStamp = new Date().toISOString().slice(0, 10);
  const blob = new Blob([`${CSV_UTF8_BOM}${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `nbos-bonus-pool-employees-${dateStamp}.csv`;
  anchor.rel = 'noopener';
  anchor.click();
  URL.revokeObjectURL(url);
}
