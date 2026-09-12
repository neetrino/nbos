import { describe, expect, it } from 'vitest';
import { flattenMessageKeys } from '../../../../i18n/flatten-messages';
import enDeliveryBoard from '../../../../messages/en/delivery-board.json';
import ruDeliveryBoard from '../../../../messages/ru/delivery-board.json';
import { DELIVERY_STAGE_LABELS } from './project-delivery-board-model';
import { PRODUCT_LANGUAGE_OPTIONS } from './delivery-product-language-options';
import { STAGE_READINESS_LABELS } from './delivery-stage-readiness-rows';
import {
  DELIVERY_STAGE_MESSAGE_KEYS,
  PRODUCT_LANGUAGE_CODES,
  PRODUCT_LANGUAGE_MESSAGE_KEYS,
  READINESS_LABEL_MESSAGE_KEYS,
} from './delivery-board-message-keys';

function placeholderTokens(value: string): string[] {
  return [
    ...new Set(
      [...value.matchAll(/\{([a-zA-Z0-9_]+)(?:,[^}]*)?\}/g)]
        .map((match) => match[1])
        .filter((token): token is string => Boolean(token)),
    ),
  ].sort();
}

function collectIcuStrings(
  catalog: Record<string, unknown>,
  prefix = '',
): Array<{ path: string; value: string }> {
  const rows: Array<{ path: string; value: string }> = [];
  for (const [key, value] of Object.entries(catalog)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      if (value.includes('{')) rows.push({ path, value });
      continue;
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      rows.push(...collectIcuStrings(value as Record<string, unknown>, path));
    }
  }
  return rows;
}

describe('deliveryBoard message keys', () => {
  it('covers every delivery stage VALUE key', () => {
    expect(Object.keys(DELIVERY_STAGE_MESSAGE_KEYS).sort()).toEqual(
      Object.keys(DELIVERY_STAGE_LABELS).sort(),
    );
  });

  it('covers every product language code', () => {
    expect(Object.keys(PRODUCT_LANGUAGE_MESSAGE_KEYS).sort()).toEqual(
      PRODUCT_LANGUAGE_OPTIONS.map((option) => option.value).sort(),
    );
    expect(PRODUCT_LANGUAGE_CODES).toEqual(PRODUCT_LANGUAGE_OPTIONS.map((option) => option.value));
  });

  it('covers every readiness English VALUE', () => {
    expect(Object.keys(READINESS_LABEL_MESSAGE_KEYS).sort()).toEqual(
      Object.values(STAGE_READINESS_LABELS).sort(),
    );
  });

  it('keeps EN/RU catalog keys aligned', () => {
    expect(flattenMessageKeys(enDeliveryBoard).sort()).toEqual(
      flattenMessageKeys(ruDeliveryBoard).sort(),
    );
  });

  it('keeps ICU placeholders aligned between EN and RU', () => {
    const enIcu = collectIcuStrings(enDeliveryBoard);
    const ruCatalog = ruDeliveryBoard as Record<string, unknown>;
    for (const row of enIcu) {
      const ruValue = row.path.split('.').reduce<unknown>((current, part) => {
        if (!current || typeof current !== 'object') return undefined;
        return (current as Record<string, unknown>)[part];
      }, ruCatalog);
      expect(typeof ruValue).toBe('string');
      expect(placeholderTokens(String(ruValue))).toEqual(placeholderTokens(row.value));
    }
  });
});
