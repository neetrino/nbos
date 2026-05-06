import path from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Curated subset for «критичные гейты» after large vertical slices.
 * Standalone config so `include` is not merged with the full suite (vitest mergeConfig unions arrays).
 */
const REGRESSION_TEST_PATHS = [
  'apps/api/src/security/**/*.test.ts',
  'apps/api/src/modules/reports/reports.service.test.ts',
  'apps/api/src/modules/reports/reports-schedule-runner.service.test.ts',
  'apps/api/src/modules/finance/invoices/invoice-money-status.test.ts',
  'apps/api/src/modules/finance/invoices/invoices.service.test.ts',
  'apps/api/src/modules/crm/deals/deals.service.test.ts',
  'apps/api/src/modules/crm/deals/deal-stage-gate.test.ts',
  'apps/api/src/modules/support/support.service.test.ts',
  'apps/api/src/modules/credentials/credentials.service.test.ts',
  'apps/api/src/modules/expenses/expenses.service.test.ts',
  'apps/api/src/modules/payroll-runs/payroll-runs.service.test.ts',
  'apps/api/src/modules/employees/employee-wallet.service.test.ts',
  'apps/api/src/modules/messenger/messenger-list-page-size.test.ts',
  'packages/shared/src/schemas/index.test.ts',
  'packages/shared/src/partner-deal-finance.test.ts',
] as const;

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/web/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: [...REGRESSION_TEST_PATHS],
  },
});
