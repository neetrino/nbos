'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  EmptyState,
  ErrorState,
  IntegratedSearchFilters,
  LoadingState,
  useModuleHeroSlots,
} from '@/components/shared';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { salaryBoardPageTitle } from '@/features/finance/constants/finance-route-page-titles';
import {
  PAYROLL_RUNS_LIST_MONTH_FROM_QUERY,
  PAYROLL_RUNS_LIST_MONTH_TO_QUERY,
  parsePayrollRunsListMonthParam,
} from '@/features/finance/constants/payroll-runs-list-url';
import { PAYROLL_RUN_STATUS_LABEL } from '@/features/finance/constants/payroll-run-ui';
import { salaryLineStatusBoardUi } from '@/features/finance/constants/salary-board-line-status';
import { formatAmount } from '@/features/finance/constants/finance';
import { useFinanceDocumentTitle } from '@/features/finance/hooks/use-finance-document-title';
import { getApiErrorMessage } from '@/lib/api-errors';
import { payrollRunsApi, type SalaryBoardResponse } from '@/lib/api/payroll-runs';
import {
  buildPayrollMonthRangeFilterConfigs,
  PAYROLL_FILTER_MONTH_FROM_KEY,
  PAYROLL_FILTER_MONTH_TO_KEY,
} from '@/features/finance/components/payroll/build-payroll-integrated-filter-configs';
import { cn } from '@/lib/utils';

function parseAmount(value: string): number {
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

function employeeLabel(emp: SalaryBoardResponse['rows'][number]['employee']): string {
  return `${emp.firstName} ${emp.lastName}`.trim();
}

export function SalaryBoardPageContent() {
  useFinanceDocumentTitle(salaryBoardPageTitle());

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<SalaryBoardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const monthFrom = parsePayrollRunsListMonthParam(
    searchParams.get(PAYROLL_RUNS_LIST_MONTH_FROM_QUERY),
  );
  const monthTo = parsePayrollRunsListMonthParam(
    searchParams.get(PAYROLL_RUNS_LIST_MONTH_TO_QUERY),
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const board = await payrollRunsApi.getSalaryBoard({
        payrollMonthFrom: monthFrom,
        payrollMonthTo: monthTo,
      });
      setData(board);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Could not load salary board'));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [monthFrom, monthTo]);

  useEffect(() => {
    void load();
  }, [load]);

  const salaryFilterConfigs = useMemo(() => buildPayrollMonthRangeFilterConfigs(), []);

  const salaryFilterValues = useMemo(
    () => ({
      [PAYROLL_FILTER_MONTH_FROM_KEY]: monthFrom ?? 'all',
      [PAYROLL_FILTER_MONTH_TO_KEY]: monthTo ?? 'all',
    }),
    [monthFrom, monthTo],
  );

  const replaceSalaryBoardUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams.toString());
      mutate(next);
      const q = next.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    },
    [pathname, router, searchParams],
  );

  const handleSalaryFilterChange = useCallback(
    (key: string, value: string) => {
      const monthValue = value === 'all' ? undefined : value;
      if (key === PAYROLL_FILTER_MONTH_FROM_KEY) {
        replaceSalaryBoardUrl((params) => {
          if (!monthValue) {
            params.delete(PAYROLL_RUNS_LIST_MONTH_FROM_QUERY);
          } else {
            params.set(PAYROLL_RUNS_LIST_MONTH_FROM_QUERY, monthValue);
          }
        });
        return;
      }
      if (key === PAYROLL_FILTER_MONTH_TO_KEY) {
        replaceSalaryBoardUrl((params) => {
          if (!monthValue) {
            params.delete(PAYROLL_RUNS_LIST_MONTH_TO_QUERY);
          } else {
            params.set(PAYROLL_RUNS_LIST_MONTH_TO_QUERY, monthValue);
          }
        });
      }
    },
    [replaceSalaryBoardUrl],
  );

  const handleClearSalaryFilters = useCallback(() => {
    replaceSalaryBoardUrl((params) => {
      params.delete(PAYROLL_RUNS_LIST_MONTH_FROM_QUERY);
      params.delete(PAYROLL_RUNS_LIST_MONTH_TO_QUERY);
    });
  }, [replaceSalaryBoardUrl]);

  const moduleHeroSlots = useMemo(
    () => ({
      search: (
        <IntegratedSearchFilters
          search=""
          onSearchChange={() => undefined}
          searchPlaceholder="Filter salary range…"
          filters={salaryFilterConfigs}
          filterValues={salaryFilterValues}
          onFilterChange={handleSalaryFilterChange}
          onClearAll={handleClearSalaryFilters}
        />
      ),
    }),
    [handleClearSalaryFilters, handleSalaryFilterChange, salaryFilterConfigs, salaryFilterValues],
  );

  useModuleHeroSlots(moduleHeroSlots);

  if (loading && !data) {
    return <LoadingState />;
  }

  if (error && !data) {
    return <ErrorState description={error} onRetry={() => void load()} />;
  }

  if (!data) {
    return (
      <EmptyState icon={Users} title="No data" description="Salary data response was empty." />
    );
  }

  return (
    <div className="flex min-h-0 flex-col gap-6">
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}

      {data.rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees"
          description="No non-terminated employees are available for the salary view."
        />
      ) : (
        <div className="border-border overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40">
                <th
                  className={cn(
                    'border-border text-foreground sticky left-0 z-20 border-r border-b px-3 py-2 text-left font-semibold',
                    'bg-background',
                  )}
                >
                  Employee
                </th>
                {data.columns.map((col) => (
                  <th
                    key={col.payrollMonth}
                    className="border-border border-b px-2 py-2 text-center font-semibold"
                  >
                    <div className="flex flex-col items-center gap-1">
                      {col.payrollRunId ? (
                        <Link
                          href={`/finance/payroll/${col.payrollRunId}`}
                          className="text-primary hover:underline"
                        >
                          {col.payrollMonth}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">{col.payrollMonth}</span>
                      )}
                      {col.runStatus ? (
                        <span className="text-muted-foreground text-xs font-normal">
                          {PAYROLL_RUN_STATUS_LABEL[col.runStatus]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs font-normal">No run</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.employee.id} className="hover:bg-muted/20">
                  <td
                    className={cn(
                      'border-border text-foreground sticky left-0 z-10 border-r border-b px-3 py-2',
                      'bg-background',
                    )}
                  >
                    <div className="font-medium">{employeeLabel(row.employee)}</div>
                    {row.employee.position ? (
                      <div className="text-muted-foreground text-xs">{row.employee.position}</div>
                    ) : null}
                  </td>
                  {row.cells.map((cell, idx) => {
                    const monthKey = data.months[idx] ?? `col-${idx}`;
                    const lineUi = cell ? salaryLineStatusBoardUi(cell.lineStatus) : null;
                    return (
                      <td key={monthKey} className="border-border border-b px-1 py-1 align-top">
                        {cell && lineUi ? (
                          <Link
                            href={`/finance/payroll/${cell.payrollRunId}#salary-line-${cell.salaryLineId}`}
                            className="hover:bg-muted/60 flex flex-col items-center gap-1 rounded-md px-1 py-2 transition-colors"
                          >
                            <StatusBadge label={lineUi.label} variant={lineUi.variant} />
                            <span className="text-muted-foreground text-xs tabular-nums">
                              {formatAmount(parseAmount(cell.totalPayable))}
                            </span>
                          </Link>
                        ) : (
                          <div className="text-muted-foreground flex min-h-[3rem] items-center justify-center text-xs">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
