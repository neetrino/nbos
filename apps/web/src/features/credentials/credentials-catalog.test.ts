import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import enCredentials from '@/messages/en/credentials.json';
import ruCredentials from '@/messages/ru/credentials.json';
import { flattenMessageKeys } from '@/i18n/flatten-messages';
import {
  commentLabelMessageKey,
  dynamicFieldLabelMessageKey,
} from '@/features/credentials/credential-field-config';
import {
  credentialAccessMessageKey,
  credentialCategoryMessageKey,
  credentialTypeMessageKey,
} from '@/features/credentials/constants/credentials';
import {
  buildCredentialsVaultFilterConfigs,
  buildCredentialsVaultFilterCopy,
} from '@/features/credentials/utils/build-credentials-vault-filter-configs';

describe('credentials catalogs', () => {
  it('keeps EN/RU keys aligned', () => {
    expect(flattenMessageKeys(enCredentials).sort()).toEqual(
      flattenMessageKeys(ruCredentials).sort(),
    );
  });

  it('keeps ICU placeholders aligned', () => {
    expect(enCredentials.titleTrash).toContain('{module}');
    expect(ruCredentials.titleTrash).toContain('{module}');
    expect(enCredentials.settings.title).toContain('{module}');
    expect(ruCredentials.settings.title).toContain('{module}');
    expect(enCredentials.table.selectNamed).toContain('{name}');
    expect(ruCredentials.table.selectNamed).toContain('{name}');
    expect(enCredentials.criticality.aria).toContain('{label}');
    expect(ruCredentials.criticality.aria).toContain('{label}');
    expect(enCredentials.settings.exportSuccess).toContain('count');
    expect(ruCredentials.settings.exportSuccess).toContain('count');
  });

  it('formats Russian export plurals for 0/1/2/5/11/21', () => {
    const t = createTranslator({
      locale: 'ru',
      messages: { credentials: ruCredentials },
    });
    const samples = [
      [0, 'Экспортировано 0 паролей'],
      [1, 'Экспортирован 1 пароль'],
      [2, 'Экспортировано 2 пароля'],
      [5, 'Экспортировано 5 паролей'],
      [11, 'Экспортировано 11 паролей'],
      [21, 'Экспортирован 21 пароль'],
    ] as const;

    for (const [count, expected] of samples) {
      expect(t('credentials.settings.exportSuccess', { count })).toBe(expected);
    }
  });

  it('does not put secret values into catalogs', () => {
    const enFlat = JSON.stringify(enCredentials);
    const ruFlat = JSON.stringify(ruCredentials);
    expect(enFlat).not.toMatch(/sk_live|BEGIN (OPENSSH|RSA) PRIVATE KEY|password123/i);
    expect(ruFlat).not.toMatch(/sk_live|BEGIN (OPENSSH|RSA) PRIVATE KEY|password123/i);
  });

  it('maps stored enum values to message keys without changing values', () => {
    expect(credentialCategoryMessageKey('ADMIN')).toBe('categories.ADMIN');
    expect(credentialTypeMessageKey('API_KEY')).toBe('types.API_KEY');
    expect(credentialAccessMessageKey('PROJECT_TEAM')).toBe('access.PROJECT_TEAM');
    expect(dynamicFieldLabelMessageKey('SSH_PRIVATE_KEY', 'url')).toBe(
      'fields.SSH_PRIVATE_KEY.url',
    );
    expect(dynamicFieldLabelMessageKey('LOGIN_PASSWORD', 'apiKey')).toBe('fields.defaults.apiKey');
    expect(commentLabelMessageKey('RECOVERY_CODES')).toBe('form.recoveryCodes');
    expect(commentLabelMessageKey('LOGIN_PASSWORD')).toBe('form.comment');
  });

  it('builds filter copy from the translator', () => {
    const t = createTranslator({
      locale: 'en',
      messages: { credentials: enCredentials },
    });
    const copy = buildCredentialsVaultFilterCopy((key) => t(`credentials.${key}` as never));
    expect(copy.sortRecent).toBe('Recently used');
    expect(copy.categoryOptionLabel('MAIL', 'Mail')).toBe('Mail');
    expect(copy.typeOptionLabel('ENV_BUNDLE', 'ENV bundle')).toBe('ENV bundle');
    expect(copy.accessOptionLabel('PERSONAL', 'My')).toBe('My');
  });

  it('keeps English filter labels when copy is omitted', () => {
    const configs = buildCredentialsVaultFilterConfigs('all', 'active');
    expect(configs[0]?.defaultOptionLabel).toBe('Recently used');
    expect(configs.find((item) => item.key === 'accessLevel')?.label).toBe('Access type');
  });
});
