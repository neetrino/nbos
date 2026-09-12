import type enCommon from '../messages/en/common.json';
import type enAccount from '../messages/en/account.json';
import type enNavigation from '../messages/en/navigation.json';
import type enDashboard from '../messages/en/dashboard.json';
import type enDashboardDeskLine from '../messages/en/dashboard-desk-line.json';
import type enForms from '../messages/en/forms.json';
import type enHr from '../messages/en/hr.json';
import type enTasks from '../messages/en/tasks.json';
import type enSearch from '../messages/en/search.json';
import type enNotifications from '../messages/en/notifications.json';
import type enWorkSpaces from '../messages/en/work-spaces.json';

type Messages = {
  common: typeof enCommon;
  account: typeof enAccount;
  navigation: typeof enNavigation;
  dashboard: typeof enDashboard;
  dashboardDeskLine: typeof enDashboardDeskLine;
  forms: typeof enForms;
  hr: typeof enHr;
  tasks: typeof enTasks;
  search: typeof enSearch;
  notifications: typeof enNotifications;
  workSpaces: typeof enWorkSpaces;
};

declare module 'next-intl' {
  interface AppConfig {
    Locale: 'en' | 'ru';
    Messages: Messages;
  }
}
