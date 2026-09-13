import { describe, expect, it } from 'vitest';
import enAccount from '../messages/en/account.json';
import enCommon from '../messages/en/common.json';
import enDashboard from '../messages/en/dashboard.json';
import enForms from '../messages/en/forms.json';
import enHr from '../messages/en/hr.json';
import enNavigation from '../messages/en/navigation.json';
import enNotifications from '../messages/en/notifications.json';
import enWorkSpaces from '../messages/en/work-spaces.json';
import enCrm from '../messages/en/crm.json';
import enSupport from '../messages/en/support.json';
import enInvoices from '../messages/en/invoices.json';
import enDeliveryBoard from '../messages/en/delivery-board.json';
import enPayroll from '../messages/en/payroll.json';
import enCredentials from '../messages/en/credentials.json';
import enExpenses from '../messages/en/expenses.json';
import enExpensePlans from '../messages/en/expense-plans.json';
import enClientServices from '../messages/en/client-services.json';
import enSearch from '../messages/en/search.json';
import enTasks from '../messages/en/tasks.json';
import enQuick from '../messages/en/quick.json';
import enChecklist from '../messages/en/checklist.json';
import enMarketing from '../messages/en/marketing.json';
import ruAccount from '../messages/ru/account.json';
import ruCommon from '../messages/ru/common.json';
import ruDashboard from '../messages/ru/dashboard.json';
import ruForms from '../messages/ru/forms.json';
import ruHr from '../messages/ru/hr.json';
import ruNavigation from '../messages/ru/navigation.json';
import ruNotifications from '../messages/ru/notifications.json';
import ruWorkSpaces from '../messages/ru/work-spaces.json';
import ruCrm from '../messages/ru/crm.json';
import ruSupport from '../messages/ru/support.json';
import ruInvoices from '../messages/ru/invoices.json';
import ruDeliveryBoard from '../messages/ru/delivery-board.json';
import ruPayroll from '../messages/ru/payroll.json';
import ruCredentials from '../messages/ru/credentials.json';
import ruExpenses from '../messages/ru/expenses.json';
import ruExpensePlans from '../messages/ru/expense-plans.json';
import ruClientServices from '../messages/ru/client-services.json';
import ruSearch from '../messages/ru/search.json';
import ruTasks from '../messages/ru/tasks.json';
import ruQuick from '../messages/ru/quick.json';
import ruChecklist from '../messages/ru/checklist.json';
import ruMarketing from '../messages/ru/marketing.json';
import hyAccount from '../messages/hy/account.json';
import hyCommon from '../messages/hy/common.json';
import hyDashboard from '../messages/hy/dashboard.json';
import hyForms from '../messages/hy/forms.json';
import hyHr from '../messages/hy/hr.json';
import hyNavigation from '../messages/hy/navigation.json';
import hyNotifications from '../messages/hy/notifications.json';
import hyWorkSpaces from '../messages/hy/work-spaces.json';
import hyCrm from '../messages/hy/crm.json';
import hySupport from '../messages/hy/support.json';
import hyInvoices from '../messages/hy/invoices.json';
import hyDeliveryBoard from '../messages/hy/delivery-board.json';
import hyPayroll from '../messages/hy/payroll.json';
import hyCredentials from '../messages/hy/credentials.json';
import hyExpenses from '../messages/hy/expenses.json';
import hyExpensePlans from '../messages/hy/expense-plans.json';
import hyClientServices from '../messages/hy/client-services.json';
import hySearch from '../messages/hy/search.json';
import hyTasks from '../messages/hy/tasks.json';
import hyQuick from '../messages/hy/quick.json';
import hyChecklist from '../messages/hy/checklist.json';
import hyMarketing from '../messages/hy/marketing.json';
import { extractIcuArgNames } from './extract-icu-arg-names';
import { flattenMessageEntries, flattenMessageKeys } from './flatten-messages';
import { mergeMessages } from './merge-messages';

const COMPLETED_CATALOG_TRIPLES = [
  [enCommon, ruCommon, hyCommon],
  [enAccount, ruAccount, hyAccount],
  [enNavigation, ruNavigation, hyNavigation],
  [enDashboard, ruDashboard, hyDashboard],
  [enForms, ruForms, hyForms],
  [enHr, ruHr, hyHr],
  [enTasks, ruTasks, hyTasks],
  [enSearch, ruSearch, hySearch],
  [enNotifications, ruNotifications, hyNotifications],
  [enWorkSpaces, ruWorkSpaces, hyWorkSpaces],
  [enCrm, ruCrm, hyCrm],
  [enSupport, ruSupport, hySupport],
  [enInvoices, ruInvoices, hyInvoices],
  [enDeliveryBoard, ruDeliveryBoard, hyDeliveryBoard],
  [enPayroll, ruPayroll, hyPayroll],
  [enCredentials, ruCredentials, hyCredentials],
  [enExpenses, ruExpenses, hyExpenses],
  [enExpensePlans, ruExpensePlans, hyExpensePlans],
  [enClientServices, ruClientServices, hyClientServices],
  [enQuick, ruQuick, hyQuick],
  [enChecklist, ruChecklist, hyChecklist],
  [enMarketing, ruMarketing, hyMarketing],
] as const;

describe('completed i18n catalogs', () => {
  it('keeps EN/RU/HY keys aligned for finished namespaces', () => {
    for (const [enCatalog, ruCatalog, hyCatalog] of COMPLETED_CATALOG_TRIPLES) {
      const enKeys = flattenMessageKeys(enCatalog).sort();
      expect(flattenMessageKeys(ruCatalog).sort()).toEqual(enKeys);
      expect(flattenMessageKeys(hyCatalog).sort()).toEqual(enKeys);
    }
  });

  it('falls back to English when a Russian string is missing', () => {
    const merged = mergeMessages(enCommon, { save: 'Сохранить' });
    expect(merged.cancel).toBe(enCommon.cancel);
    expect(merged.save).toBe('Сохранить');
  });

  it('merges a partial nested overlay without dropping sibling English keys', () => {
    const merged = mergeMessages(enCommon, {
      accessDenied: { title: 'Доступ ограничен' },
    });
    expect(merged.accessDenied.kicker).toBe(enCommon.accessDenied.kicker);
    expect(merged.accessDenied.title).toBe('Доступ ограничен');
    expect(merged.accessDenied.signIn).toBe(enCommon.accessDenied.signIn);
  });

  it('keeps ICU argument names aligned across EN/RU/HY', () => {
    for (const [enCatalog, ruCatalog, hyCatalog] of COMPLETED_CATALOG_TRIPLES) {
      const ruValues = new Map(
        flattenMessageEntries(ruCatalog).map((entry) => [entry.path, entry.value]),
      );
      const hyValues = new Map(
        flattenMessageEntries(hyCatalog).map((entry) => [entry.path, entry.value]),
      );
      for (const { path, value } of flattenMessageEntries(enCatalog)) {
        const expected = extractIcuArgNames(value);
        expect(extractIcuArgNames(ruValues.get(path) ?? ''), path).toEqual(expected);
        expect(extractIcuArgNames(hyValues.get(path) ?? ''), path).toEqual(expected);
      }
    }
  });
});
