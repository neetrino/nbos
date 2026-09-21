import type { CatalogSeedItem } from './catalog-seed-types';

/**
 * Армянские банки на общем протоколе ArCa. ArCa — не банк, а система, через которую работают все
 * банки страны, кроме InecoBank и Ameriabank со своими шлюзами. Объём работы у них одинаковый,
 * поэтому и units одинаковые; отдельные карточки нужны, чтобы исполнитель знал конкретный банк и
 * его доступы. Новый банк — копия этой карточки с тем же вектором.
 */
export const ARCA_BANK_ITEMS: readonly CatalogSeedItem[] = [
  {
    code: 'PAY_ACBA',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'ACBA Bank acquiring',
    summary: 'Card payments through ACBA Bank via the ArCa gateway.',
    scopeBoundaries:
      'One bank using the ArCa protocol: order registration, 3-D Secure, refunds, decline handling, and test and production environments. The scope is the same for every ArCa bank; separate cards identify the specific bank and credentials.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_ARDSHINBANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Ardshinbank acquiring',
    summary: 'Card payments through Ardshinbank via the ArCa gateway.',
    scopeBoundaries:
      'One bank using the ArCa protocol: order registration, 3-D Secure, refunds, decline handling, and test and production environments. The scope is the same for every ArCa bank; separate cards identify the specific bank and credentials.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_ARMECONOMBANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Armeconombank acquiring',
    summary: 'Card payments through Armeconombank via the ArCa gateway.',
    scopeBoundaries:
      'One bank using the ArCa protocol: order registration, 3-D Secure, refunds, decline handling, and test and production environments. The scope is the same for every ArCa bank; separate cards identify the specific bank and credentials.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_CONVERSE',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Converse Bank acquiring',
    summary: 'Card payments through Converse Bank via the ArCa gateway.',
    scopeBoundaries:
      'One bank using the ArCa protocol: order registration, 3-D Secure, refunds, decline handling, and test and production environments. The scope is the same for every ArCa bank; separate cards identify the specific bank and credentials.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_EVOCA',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Evocabank acquiring',
    summary: 'Card payments through Evocabank via the ArCa gateway.',
    scopeBoundaries:
      'One bank using the ArCa protocol: order registration, 3-D Secure, refunds, decline handling, and test and production environments. The scope is the same for every ArCa bank; separate cards identify the specific bank and credentials.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_UNIBANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Unibank acquiring',
    summary: 'Card payments through Unibank via the ArCa gateway.',
    scopeBoundaries:
      'One bank using the ArCa protocol: order registration, 3-D Secure, refunds, decline handling, and test and production environments. The scope is the same for every ArCa bank; separate cards identify the specific bank and credentials.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_FAST_BANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Fast Bank acquiring',
    summary: 'Card payments through Fast Bank via the ArCa gateway.',
    scopeBoundaries:
      'One bank using the ArCa protocol: order registration, 3-D Secure, refunds, decline handling, and test and production environments. The scope is the same for every ArCa bank; separate cards identify the specific bank and credentials.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_ARMSWISSBANK',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'ArmSwissBank acquiring',
    summary: 'Card payments through ArmSwissBank via the ArCa gateway.',
    scopeBoundaries:
      'One bank using the ArCa protocol: order registration, 3-D Secure, refunds, decline handling, and test and production environments. The scope is the same for every ArCa bank; separate cards identify the specific bank and credentials.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
  {
    code: 'PAY_BYBLOS',
    category: 'payments',
    iconKey: 'CreditCard',
    title: 'Byblos Bank Armenia acquiring',
    summary: 'Card payments through Byblos Bank Armenia via the ArCa gateway.',
    scopeBoundaries:
      'One bank using the ArCa protocol: order registration, 3-D Secure, refunds, decline handling, and test and production environments. The scope is the same for every ArCa bank; separate cards identify the specific bank and credentials.',
    units: { BACKEND: 14, FRONTEND: 4, PM: 2, QA: 3, TECHNICAL_SPECIALIST: 2 },
  },
] as const;
