import { describe, expect, it } from 'vitest';
import enAccount from '../messages/en/account.json';
import enCommon from '../messages/en/common.json';
import enDashboard from '../messages/en/dashboard.json';
import enDashboardDeskLine from '../messages/en/dashboard-desk-line.json';
import enForms from '../messages/en/forms.json';
import enHr from '../messages/en/hr.json';
import enNavigation from '../messages/en/navigation.json';
import enNotifications from '../messages/en/notifications.json';
import enSearch from '../messages/en/search.json';
import enTasks from '../messages/en/tasks.json';
import ruAccount from '../messages/ru/account.json';
import ruCommon from '../messages/ru/common.json';
import ruDashboard from '../messages/ru/dashboard.json';
import ruDashboardDeskLine from '../messages/ru/dashboard-desk-line.json';
import ruForms from '../messages/ru/forms.json';
import ruHr from '../messages/ru/hr.json';
import ruNavigation from '../messages/ru/navigation.json';
import ruNotifications from '../messages/ru/notifications.json';
import ruSearch from '../messages/ru/search.json';
import ruTasks from '../messages/ru/tasks.json';
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
    expect(flattenMessageKeys(enDashboardDeskLine).sort()).toEqual(
      flattenMessageKeys(ruDashboardDeskLine).sort(),
    );
    expect(flattenMessageKeys(enForms).sort()).toEqual(flattenMessageKeys(ruForms).sort());
    expect(flattenMessageKeys(enHr).sort()).toEqual(flattenMessageKeys(ruHr).sort());
    expect(flattenMessageKeys(enTasks).sort()).toEqual(flattenMessageKeys(ruTasks).sort());
    expect(flattenMessageKeys(enSearch).sort()).toEqual(flattenMessageKeys(ruSearch).sort());
    expect(flattenMessageKeys(enNotifications).sort()).toEqual(
      flattenMessageKeys(ruNotifications).sort(),
    );
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
  });
});
