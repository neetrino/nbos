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
import { flattenMessageKeys } from './flatten-messages';
import { mergeMessages } from './merge-messages';

describe('completed i18n catalogs', () => {
  it('keeps EN/RU keys aligned for finished namespaces', () => {
    expect(flattenMessageKeys(enCommon).sort()).toEqual(flattenMessageKeys(ruCommon).sort());
    expect(flattenMessageKeys(enAccount).sort()).toEqual(flattenMessageKeys(ruAccount).sort());
    expect(flattenMessageKeys(enNavigation).sort()).toEqual(
      flattenMessageKeys(ruNavigation).sort(),
    );
    expect(flattenMessageKeys(enDashboard).sort()).toEqual(flattenMessageKeys(ruDashboard).sort());
    expect(flattenMessageKeys(enForms).sort()).toEqual(flattenMessageKeys(ruForms).sort());
    expect(flattenMessageKeys(enHr).sort()).toEqual(flattenMessageKeys(ruHr).sort());
    expect(flattenMessageKeys(enTasks).sort()).toEqual(flattenMessageKeys(ruTasks).sort());
    expect(flattenMessageKeys(enSearch).sort()).toEqual(flattenMessageKeys(ruSearch).sort());
    expect(flattenMessageKeys(enNotifications).sort()).toEqual(
      flattenMessageKeys(ruNotifications).sort(),
    );
    expect(flattenMessageKeys(enWorkSpaces).sort()).toEqual(
      flattenMessageKeys(ruWorkSpaces).sort(),
    );
    expect(flattenMessageKeys(enCrm).sort()).toEqual(flattenMessageKeys(ruCrm).sort());
    expect(flattenMessageKeys(enSupport).sort()).toEqual(flattenMessageKeys(ruSupport).sort());
    expect(flattenMessageKeys(enInvoices).sort()).toEqual(flattenMessageKeys(ruInvoices).sort());
    expect(flattenMessageKeys(enDeliveryBoard).sort()).toEqual(
      flattenMessageKeys(ruDeliveryBoard).sort(),
    );
    expect(flattenMessageKeys(enPayroll).sort()).toEqual(flattenMessageKeys(ruPayroll).sort());
    expect(flattenMessageKeys(enCredentials).sort()).toEqual(
      flattenMessageKeys(ruCredentials).sort(),
    );
    expect(flattenMessageKeys(enExpenses).sort()).toEqual(flattenMessageKeys(ruExpenses).sort());
    expect(flattenMessageKeys(enExpensePlans).sort()).toEqual(
      flattenMessageKeys(ruExpensePlans).sort(),
    );
    expect(flattenMessageKeys(enClientServices).sort()).toEqual(
      flattenMessageKeys(ruClientServices).sort(),
    );
    expect(flattenMessageKeys(enQuick).sort()).toEqual(flattenMessageKeys(ruQuick).sort());
    expect(flattenMessageKeys(enChecklist).sort()).toEqual(flattenMessageKeys(ruChecklist).sort());
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

  it('keeps ICU placeholders aligned for account interpolation', () => {
    expect(enAccount.accountMenuAria).toContain('{name}');
    expect(ruAccount.accountMenuAria).toContain('{name}');
    expect(enDashboard.actions.newTaskDescription.length).toBeGreaterThan(0);
    expect(ruDashboard.actions.newTaskDescription.length).toBeGreaterThan(0);
    expect(enAccount.wallet.hero.nextLabel).toContain('{month}');
    expect(ruAccount.wallet.hero.nextLabel).toContain('{month}');
    expect(enAccount.sessions.minutesAgo).toContain('count');
    expect(ruAccount.sessions.minutesAgo).toContain('count');
    expect(enTasks.loadMore.of).toContain('{loaded}');
    expect(enTasks.loadMore.of).toContain('{total}');
    expect(ruTasks.loadMore.of).toContain('{loaded}');
    expect(ruTasks.loadMore.of).toContain('{total}');
    expect(enNotifications.relative.minutesAgo).toContain('count');
    expect(ruNotifications.relative.minutesAgo).toContain('count');
    expect(enNotifications.center.channel.web).toBe('Web');
    expect(ruNotifications.center.channel.web.length).toBeGreaterThan(0);
    expect(enTasks.sheet.chat.participants).toContain('count');
    expect(ruTasks.sheet.chat.participants).toContain('count');
    expect(enTasks.sheet.chat.createdBy).toContain('{name}');
    expect(ruTasks.sheet.chat.createdBy).toContain('{name}');
    expect(enTasks.sheet.checklist.progress).toContain('{done}');
    expect(ruTasks.sheet.checklist.progress).toContain('{done}');
    expect(enTasks.sheet.linked.openAria).toContain('{label}');
    expect(ruTasks.sheet.linked.openAria).toContain('{label}');
    expect(enTasks.recurring.schedule.everyDay).toContain('{time}');
    expect(ruTasks.recurring.schedule.everyDay).toContain('{time}');
    expect(enTasks.recurring.schedule.everyNDays).toContain('{n}');
    expect(ruTasks.recurring.schedule.everyNDays).toContain('{n}');
    expect(enTasks.recurring.schedule.onDaysAt).toContain('{cadence}');
    expect(enTasks.recurring.schedule.onDaysAt).toContain('{days}');
    expect(enTasks.recurring.schedule.onDaysAt).toContain('{time}');
    expect(ruTasks.recurring.schedule.onDaysAt).toContain('{cadence}');
    expect(ruTasks.recurring.schedule.onDaysAt).toContain('{days}');
    expect(ruTasks.recurring.schedule.onDaysAt).toContain('{time}');
    expect(enTasks.recurring.runCreated).toContain('{code}');
    expect(ruTasks.recurring.runCreated).toContain('{code}');
    expect(enTasks.recurring.itemPlaceholder).toContain('{n}');
    expect(ruTasks.recurring.itemPlaceholder).toContain('{n}');
    expect(enTasks.recurring.createdDue).toContain('count');
    expect(ruTasks.recurring.createdDue).toContain('count');
    expect(enWorkSpaces.tabStandalone).toContain('{count}');
    expect(ruWorkSpaces.tabStandalone).toContain('{count}');
    expect(enWorkSpaces.tabProduct).toContain('{count}');
    expect(ruWorkSpaces.tabProduct).toContain('{count}');
    expect(enWorkSpaces.tasksCount).toContain('count');
    expect(ruWorkSpaces.tasksCount).toContain('count');
    expect(enWorkSpaces.legacyLinked).toContain('{count}');
    expect(ruWorkSpaces.legacyLinked).toContain('{count}');
    expect(enCrm.merge.keepAbsorb).toContain('{keep}');
    expect(ruCrm.merge.keepAbsorb).toContain('{keep}');
    expect(enCrm.merge.keepAbsorb).toContain('{absorb}');
    expect(ruCrm.merge.keepAbsorb).toContain('{absorb}');
    expect(enHr.directory.counts).toContain('{active}');
    expect(ruHr.directory.counts).toContain('{active}');
    expect(enSupport.create.title.length).toBeGreaterThan(0);
    expect(ruSupport.create.title.length).toBeGreaterThan(0);
    expect(enInvoices.createSubscription.createdMany).toContain('count');
    expect(ruInvoices.createSubscription.createdMany).toContain('count');
    expect(enDeliveryBoard.count).toContain('filtered');
    expect(ruDeliveryBoard.count).toContain('filtered');
    expect(enDeliveryBoard.count).toContain('{total}');
    expect(ruDeliveryBoard.count).toContain('{total}');
    expect(enPayroll.list.emptyStatus).toContain('{status}');
    expect(ruPayroll.list.emptyStatus).toContain('{status}');
    expect(enCredentials.titleTrash).toContain('{module}');
    expect(ruCredentials.titleTrash).toContain('{module}');
    expect(enExpenses.nav.payNow.length).toBeGreaterThan(0);
    expect(ruExpenses.nav.payNow.length).toBeGreaterThan(0);
    expect(enCrm.stages.deal.WON.label.length).toBeGreaterThan(0);
    expect(ruCrm.stages.deal.WON.label.length).toBeGreaterThan(0);
    expect(enHr.hub.foundation.assigned).toContain('{assigned}');
    expect(ruHr.hub.foundation.assigned).toContain('{assigned}');
    expect(enExpensePlans.page.title.length).toBeGreaterThan(0);
    expect(ruExpensePlans.page.title.length).toBeGreaterThan(0);
    expect(enClientServices.page.title.length).toBeGreaterThan(0);
    expect(ruClientServices.page.title.length).toBeGreaterThan(0);
    expect(enChecklist.evidence.attachments).toContain('count');
    expect(ruChecklist.evidence.attachments).toContain('count');
    expect(enChecklist.sheet.complete.length).toBeGreaterThan(0);
    expect(ruChecklist.sheet.complete.length).toBeGreaterThan(0);
  });
});
