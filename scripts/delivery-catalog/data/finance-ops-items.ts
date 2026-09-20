import type { CatalogSeedItem } from './catalog-seed-types';

/** Финансовый учёт внутри продукта клиента: счета, касса, расходы, отчётность. */
export const FINANCE_OPS_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'FIN_INVOICES',
    category: 'finance_ops',
    iconKey: 'Receipt',
    title: 'Счета и инвойсы',
    summary: 'Выставление счетов с нумерацией и статусами.',
    scopeBoundaries:
      'Состав счёта, нумерация, налоги и итоги, печатная форма, статусы оплаты, частичная оплата.',
    units: { BACKEND: 24, FRONTEND: 12, PM: 3, DESIGNER: 3, QA: 6 },
  },
  {
    code: 'FIN_PAYMENTS_LEDGER',
    category: 'finance_ops',
    iconKey: 'Banknote',
    title: 'Учёт поступлений и платежей',
    summary: 'Журнал операций с привязкой к счетам.',
    scopeBoundaries:
      'Поступления и списания, привязка к счёту или заказу, валюта и курс, сверка, права на операции.',
    units: { BACKEND: 26, FRONTEND: 12, PM: 4, QA: 6 },
  },
  {
    code: 'FIN_CASH_REGISTER',
    category: 'finance_ops',
    iconKey: 'Store',
    title: 'Касса и смены',
    summary: 'Открытие и закрытие смены с движением наличных.',
    scopeBoundaries:
      'Смены, внесение и изъятие, отчёт по смене, расхождения, права кассира. Фискальное оборудование — отдельная карточка.',
    units: { BACKEND: 22, FRONTEND: 14, PM: 3, QA: 6 },
  },
  {
    code: 'FIN_FISCAL_DEVICE',
    category: 'finance_ops',
    iconKey: 'Printer',
    title: 'Фискальный регистратор',
    summary: 'Печать фискальных чеков через оборудование.',
    scopeBoundaries:
      'Одна модель или протокол, печать чека и возврата, обработка ошибок устройства, проверка на реальном оборудовании.',
    units: { BACKEND: 20, FRONTEND: 6, PM: 3, QA: 6, TECHNICAL_SPECIALIST: 6 },
  },
  {
    code: 'FIN_EXPENSES',
    category: 'finance_ops',
    iconKey: 'Wallet',
    title: 'Учёт расходов',
    summary: 'Расходы по категориям с подтверждением.',
    scopeBoundaries:
      'Категории расходов, вложения и подтверждение, согласование при необходимости, отчёт по периодам.',
    units: { BACKEND: 18, FRONTEND: 10, PM: 3, QA: 4 },
  },
  {
    code: 'FIN_BUDGETS',
    category: 'finance_ops',
    iconKey: 'PieChart',
    title: 'Бюджеты и планы',
    summary: 'План по статьям с контролем исполнения.',
    scopeBoundaries: 'Статьи и периоды, план и факт, отклонения, предупреждения при перерасходе.',
    units: { BACKEND: 22, FRONTEND: 12, PM: 3, QA: 5 },
  },
  {
    code: 'FIN_PAYROLL',
    category: 'finance_ops',
    iconKey: 'Coins',
    title: 'Расчёт зарплат',
    summary: 'Начисления и выплаты сотрудникам за период.',
    scopeBoundaries:
      'Оклад и переменная часть, удержания, расчёт за период, ведомость и выплаты. Налоговая отчётность — отдельная карточка.',
    units: { BACKEND: 34, FRONTEND: 16, PM: 5, QA: 10 },
  },
  {
    code: 'FIN_TAX_REPORTS',
    category: 'finance_ops',
    iconKey: 'FileSpreadsheet',
    title: 'Налоговые и регламентные отчёты',
    summary: 'Формирование отчётов по согласованным формам.',
    scopeBoundaries:
      'Согласованный перечень форм, расчёт показателей, выгрузка в нужном формате, сверка с учётом.',
    units: { BACKEND: 28, FRONTEND: 10, PM: 4, QA: 8, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'FIN_BANK_STATEMENT_IMPORT',
    category: 'finance_ops',
    iconKey: 'Upload',
    title: 'Импорт банковских выписок',
    summary: 'Загрузка выписки и сопоставление с операциями.',
    scopeBoundaries:
      'Формат одного банка, разбор файла, автоматическое сопоставление, ручная привязка остатка, защита от повторов.',
    units: { BACKEND: 22, FRONTEND: 8, PM: 3, QA: 6 },
  },
  {
    code: 'FIN_DEBT_CONTROL',
    category: 'finance_ops',
    iconKey: 'Clock',
    title: 'Контроль задолженности',
    summary: 'Долги клиентов по срокам с напоминаниями.',
    scopeBoundaries:
      'Расчёт задолженности по срокам, лимиты и блокировка отпуска, напоминания, отчёт по должникам.',
    units: { BACKEND: 20, FRONTEND: 10, PM: 3, QA: 5 },
  },
  {
    code: 'FIN_PARTNER_COMMISSIONS',
    category: 'finance_ops',
    iconKey: 'Percent',
    title: 'Комиссии партнёров',
    summary: 'Расчёт вознаграждения партнёров и агентов.',
    scopeBoundaries:
      'Правила комиссии, расчёт по сделкам, корректировки и возвраты, отчёт партнёру, выплаты по согласованному каналу.',
    units: { BACKEND: 24, FRONTEND: 10, PM: 4, QA: 6 },
  },
  {
    code: 'FIN_COST_PRICE',
    category: 'finance_ops',
    iconKey: 'Gauge',
    title: 'Себестоимость и маржа',
    summary: 'Расчёт себестоимости и прибыли по продажам.',
    scopeBoundaries:
      'Метод расчёта себестоимости, учёт закупок и возвратов, маржа по товару и заказу, отчёт по периодам.',
    units: { BACKEND: 26, FRONTEND: 10, PM: 4, QA: 7 },
  },
] as const;
