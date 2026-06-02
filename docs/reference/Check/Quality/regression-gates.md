# Regression gates (автоматический поднабор)

**Назначение:** после крупных срезов быстро проверить критичные домены без полного `pnpm test` (сотни файлов).

**Запуск:**

```bash
pnpm test:regression
```

Конфиг: `vitest.regression.config.ts` (явный список файлов — не объединяется с полным `include` из основного `vitest.config.ts`).

**Что сейчас в наборе (расширять при новых «гейтах»):**

| Область         | Файлы (пример)                                                              |
| --------------- | --------------------------------------------------------------------------- |
| Security / CORS | `apps/api/src/security/cors-origins.test.ts`                                |
| Reports export  | `reports.service.test.ts`, `reports-schedule-runner.service.test.ts`        |
| Finance         | `invoice-money-status.test.ts`, `invoices.service.test.ts`                  |
| CRM / Deals     | `deals.service.test.ts`, `deal-stage-gate.test.ts`                          |
| Support         | `support.service.test.ts`                                                   |
| Credentials     | `credentials.service.*.test.ts` (list / secrets / mutations)                |
| Expenses        | `expenses.service.test.ts`                                                  |
| Payroll         | `payroll-runs.service.test.ts`                                              |
| Wallet          | `employee-wallet.service.test.ts`                                           |
| Messenger       | `messenger-list-page-size.test.ts`                                          |
| Shared          | `packages/shared/src/schemas/index.test.ts`, `partner-deal-finance.test.ts` |

Полный прогон по-прежнему: `pnpm test`. E2E по браузеру — отдельный пункт в `IMPLEMENTATION_PROGRESS.md`.
