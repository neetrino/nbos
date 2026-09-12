import type enCommon from '../messages/en/common.json';
import type enAccount from '../messages/en/account.json';
import type enNavigation from '../messages/en/navigation.json';
import type enDashboard from '../messages/en/dashboard.json';
import type enDashboardDeskLine from '../messages/en/dashboard-desk-line.json';
import type enForms from '../messages/en/forms.json';

type Messages = {
  common: typeof enCommon;
  account: typeof enAccount;
  navigation: typeof enNavigation;
  dashboard: typeof enDashboard;
  dashboardDeskLine: typeof enDashboardDeskLine;
  forms: typeof enForms;
};

declare module 'next-intl' {
  interface AppConfig {
    Locale: 'en' | 'ru';
    Messages: Messages;
  }
}
