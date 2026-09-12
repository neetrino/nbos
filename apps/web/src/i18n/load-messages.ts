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
  dashboardDeskLine: AbstractIntlMessages;
  forms: AbstractIntlMessages;
  hr: AbstractIntlMessages;
  tasks: AbstractIntlMessages;
  search: AbstractIntlMessages;
  notifications: AbstractIntlMessages;
  workSpaces: AbstractIntlMessages;
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
    dashboardDeskLine: mergeMessages(en.dashboardDeskLine, localized.dashboardDeskLine),
    forms: mergeMessages(en.forms, localized.forms),
    hr: mergeMessages(en.hr, localized.hr),
    tasks: mergeMessages(en.tasks, localized.tasks),
    search: mergeMessages(en.search, localized.search),
    notifications: mergeMessages(en.notifications, localized.notifications),
    workSpaces: mergeMessages(en.workSpaces, localized.workSpaces),
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
    dashboardDeskLine,
    forms,
    hr,
    tasks,
    search,
    notifications,
    workSpaces,
  ] =
    await Promise.all([
      import(`../messages/${locale}/common.json`),
      import(`../messages/${locale}/account.json`),
      import(`../messages/${locale}/navigation.json`),
      import(`../messages/${locale}/dashboard.json`),
      import(`../messages/${locale}/dashboard-desk-line.json`),
      import(`../messages/${locale}/forms.json`),
      import(`../messages/${locale}/hr.json`),
      import(`../messages/${locale}/tasks.json`),
      import(`../messages/${locale}/search.json`),
      import(`../messages/${locale}/notifications.json`),
      import(`../messages/${locale}/work-spaces.json`),
    ]);
  return {
    common: common.default,
    account: account.default,
    navigation: navigation.default,
    dashboard: dashboard.default,
    dashboardDeskLine: dashboardDeskLine.default,
    forms: forms.default,
    hr: hr.default,
    tasks: tasks.default,
    search: search.default,
    notifications: notifications.default,
    workSpaces: workSpaces.default,
  };
}
