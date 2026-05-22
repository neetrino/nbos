import { SALARY_BOARD_OPEN_LINE_QUERY } from '@/features/finance/constants/salary-board-url';

const SALARY_BOARD_PATH = '/finance/salary' as const;

/** Finance Salary Board with Employee Month Compensation sheet open. */
export function salaryBoardMonthSheetHref(salaryLineId: string): string {
  const q = new URLSearchParams({ [SALARY_BOARD_OPEN_LINE_QUERY]: salaryLineId });
  return `${SALARY_BOARD_PATH}?${q.toString()}`;
}
