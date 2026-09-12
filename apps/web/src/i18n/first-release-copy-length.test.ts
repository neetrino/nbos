import { describe, expect, it } from 'vitest';
import ruAccount from '../messages/ru/account.json';
import ruCommon from '../messages/ru/common.json';
import ruDashboard from '../messages/ru/dashboard.json';
import { DASHBOARD_ACTION_MESSAGE_KEYS } from '../features/dashboard/dashboard-action-message-keys';

const FIRST_RELEASE_CRITICAL_ACTION_MAX_CHARS = 24;

function dashboardActionLabel(path: string): string {
  const [, key] = path.split('.');
  if (!key) {
    throw new Error(`Unexpected dashboard action path: ${path}`);
  }
  const value = ruDashboard.actions[key as keyof typeof ruDashboard.actions];
  if (typeof value !== 'string') {
    throw new Error(`Missing dashboard action label: ${path}`);
  }
  return value;
}

describe('first-release RU copy length', () => {
  it('keeps critical chrome actions within the compact button budget', () => {
    const labels = [
      ruCommon.save,
      ruCommon.cancel,
      ruCommon.close,
      ruCommon.create,
      ruAccount.signOut,
      ...Object.values(DASHBOARD_ACTION_MESSAGE_KEYS).map((entry) =>
        dashboardActionLabel(entry.label),
      ),
    ];

    for (const label of labels) {
      expect(label.length, label).toBeLessThanOrEqual(FIRST_RELEASE_CRITICAL_ACTION_MAX_CHARS);
    }
  });
});
