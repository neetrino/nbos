import { describe, expect, it } from 'vitest';
import enCrm from '@/messages/en/crm.json';
import ruCrm from '@/messages/ru/crm.json';
import { flattenMessageKeys } from '@/i18n/flatten-messages';

const ICU_PLACEHOLDER = /\{([a-zA-Z0-9_]+)(?:,|\})/g;

function placeholderNames(value: string): string[] {
  return [...value.matchAll(ICU_PLACEHOLDER)]
    .map((match) => match[1])
    .filter((token): token is string => Boolean(token))
    .sort();
}

describe('crm catalogs', () => {
  it('keeps EN/RU keys aligned', () => {
    expect(flattenMessageKeys(enCrm).sort()).toEqual(flattenMessageKeys(ruCrm).sort());
  });

  it('keeps ICU placeholders aligned', () => {
    const enLeaves = flattenMessageKeys(enCrm);
    for (const key of enLeaves) {
      const enValue = key.split('.').reduce<unknown>((current, part) => {
        return current && typeof current === 'object'
          ? (current as Record<string, unknown>)[part]
          : undefined;
      }, enCrm);
      const ruValue = key.split('.').reduce<unknown>((current, part) => {
        return current && typeof current === 'object'
          ? (current as Record<string, unknown>)[part]
          : undefined;
      }, ruCrm);
      if (typeof enValue !== 'string' || typeof ruValue !== 'string') continue;
      expect(placeholderNames(ruValue), key).toEqual(placeholderNames(enValue));
    }
  });
});
