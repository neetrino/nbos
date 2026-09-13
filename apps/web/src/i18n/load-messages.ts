import 'server-only';
import type { AbstractIntlMessages } from 'next-intl';
import { cache } from 'react';
import type { WritableInterfaceLocale } from '@nbos/shared';
import { mergeMessages } from './merge-messages';

export type InterfaceMessages = {
  common: AbstractIntlMessages;
  account: AbstractIntlMessages;
  navigation: AbstractIntlMessages;
  dashboard: AbstractIntlMessages;
  forms: AbstractIntlMessages;
  hr: AbstractIntlMessages;
  tasks: AbstractIntlMessages;
  search: AbstractIntlMessages;
  notifications: AbstractIntlMessages;
  workSpaces: AbstractIntlMessages;
  crm: AbstractIntlMessages;
  support: AbstractIntlMessages;
  invoices: AbstractIntlMessages;
  deliveryBoard: AbstractIntlMessages;
  payroll: AbstractIntlMessages;
  credentials: AbstractIntlMessages;
  expenses: AbstractIntlMessages;
  expensePlans: AbstractIntlMessages;
  clientServices: AbstractIntlMessages;
  quick: AbstractIntlMessages;
};

async function loadMessagesUncached(locale: WritableInterfaceLocale): Promise<InterfaceMessages> {
  const en = await loadLocaleMessages('en');
  if (locale === 'en') {
    return en;
  }

  const localized = await loadLocaleMessages(locale);
  return {
    common: mergeMessages(en.common, localized.common),
    account: mergeMessages(en.account, localized.account),
    navigation: mergeMessages(en.navigation, localized.navigation),
    dashboard: mergeMessages(en.dashboard, localized.dashboard),
    forms: mergeMessages(en.forms, localized.forms),
    hr: mergeMessages(en.hr, localized.hr),
    tasks: mergeMessages(en.tasks, localized.tasks),
    search: mergeMessages(en.search, localized.search),
    notifications: mergeMessages(en.notifications, localized.notifications),
    workSpaces: mergeMessages(en.workSpaces, localized.workSpaces),
    crm: mergeMessages(en.crm, localized.crm),
    support: mergeMessages(en.support, localized.support),
    invoices: mergeMessages(en.invoices, localized.invoices),
    deliveryBoard: mergeMessages(en.deliveryBoard, localized.deliveryBoard),
    payroll: mergeMessages(en.payroll, localized.payroll),
    credentials: mergeMessages(en.credentials, localized.credentials),
    expenses: mergeMessages(en.expenses, localized.expenses),
    expensePlans: mergeMessages(en.expensePlans, localized.expensePlans),
    clientServices: mergeMessages(en.clientServices, localized.clientServices),
    quick: mergeMessages(en.quick, localized.quick),
  };
}

/** One catalog load per request; English is not imported twice. */
export const loadMessages = cache(loadMessagesUncached);

async function loadLocaleMessages(locale: WritableInterfaceLocale): Promise<InterfaceMessages> {
  if (locale === 'ru') {
    return readLocaleCatalogs('ru');
  }
  return readLocaleCatalogs('en');
}

async function readLocaleCatalogs(locale: 'en' | 'ru'): Promise<InterfaceMessages> {
  const [
    common,
    account,
    navigation,
    dashboard,
    forms,
    hr,
    tasks,
    search,
    notifications,
    workSpaces,
    crm,
    support,
    invoices,
    deliveryBoard,
    payroll,
    credentials,
    expenses,
    expensePlans,
    clientServices,
    quick,
  ] = await Promise.all([
    import(`../messages/${locale}/common.json`),
    import(`../messages/${locale}/account.json`),
    import(`../messages/${locale}/navigation.json`),
    import(`../messages/${locale}/dashboard.json`),
    import(`../messages/${locale}/forms.json`),
    import(`../messages/${locale}/hr.json`),
    import(`../messages/${locale}/tasks.json`),
    import(`../messages/${locale}/search.json`),
    import(`../messages/${locale}/notifications.json`),
    import(`../messages/${locale}/work-spaces.json`),
    import(`../messages/${locale}/crm.json`),
    import(`../messages/${locale}/support.json`),
    import(`../messages/${locale}/invoices.json`),
    import(`../messages/${locale}/delivery-board.json`),
    import(`../messages/${locale}/payroll.json`),
    import(`../messages/${locale}/credentials.json`),
    import(`../messages/${locale}/expenses.json`),
    import(`../messages/${locale}/expense-plans.json`),
    import(`../messages/${locale}/client-services.json`),
    import(`../messages/${locale}/quick.json`),
  ]);
  return {
    common: common.default,
    account: account.default,
    navigation: navigation.default,
    dashboard: dashboard.default,
    forms: forms.default,
    hr: hr.default,
    tasks: tasks.default,
    search: search.default,
    notifications: notifications.default,
    workSpaces: workSpaces.default,
    crm: crm.default,
    support: support.default,
    invoices: invoices.default,
    deliveryBoard: deliveryBoard.default,
    payroll: payroll.default,
    credentials: credentials.default,
    expenses: expenses.default,
    expensePlans: expensePlans.default,
    clientServices: clientServices.default,
    quick: quick.default,
  };
}
