import type enCommon from '../messages/en/common.json';
import type enAccount from '../messages/en/account.json';
import type enNavigation from '../messages/en/navigation.json';
import type enDashboard from '../messages/en/dashboard.json';
import type enForms from '../messages/en/forms.json';
import type enHr from '../messages/en/hr.json';
import type enTasks from '../messages/en/tasks.json';
import type enSearch from '../messages/en/search.json';
import type enNotifications from '../messages/en/notifications.json';
import type enWorkSpaces from '../messages/en/work-spaces.json';
import type enCrm from '../messages/en/crm.json';
import type enSupport from '../messages/en/support.json';
import type enInvoices from '../messages/en/invoices.json';
import type enDeliveryBoard from '../messages/en/delivery-board.json';
import type enPayroll from '../messages/en/payroll.json';
import type enCredentials from '../messages/en/credentials.json';
import type enExpenses from '../messages/en/expenses.json';

type Messages = {
  common: typeof enCommon;
  account: typeof enAccount;
  navigation: typeof enNavigation;
  dashboard: typeof enDashboard;
  forms: typeof enForms;
  hr: typeof enHr;
  tasks: typeof enTasks;
  search: typeof enSearch;
  notifications: typeof enNotifications;
  workSpaces: typeof enWorkSpaces;
  crm: typeof enCrm;
  support: typeof enSupport;
  invoices: typeof enInvoices;
  deliveryBoard: typeof enDeliveryBoard;
  payroll: typeof enPayroll;
  credentials: typeof enCredentials;
  expenses: typeof enExpenses;
};

declare module 'next-intl' {
  interface AppConfig {
    Locale: 'en' | 'ru';
    Messages: Messages;
  }
}
