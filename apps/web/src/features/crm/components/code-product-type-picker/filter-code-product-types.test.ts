import { describe, expect, it } from 'vitest';
import { filterAndRankCodeProductTypes } from './filter-code-product-types';
import type { CodeProductTypeOption } from './code-product-type-picker.types';

const OPTIONS: CodeProductTypeOption[] = [
  {
    value: 'ECOMMERCE',
    label: 'Shop',
    description: 'Online shop of your own catalog: cart, order, and payment.',
  },
  {
    value: 'CRM',
    label: 'CRM / clients',
    description: 'Client and deal database: pipeline and seller tasks.',
  },
  {
    value: 'CUSTOMER_PORTAL',
    label: 'Client portal',
    description: 'Customer cabinet: orders, documents, tickets, and profile.',
  },
  {
    value: 'HELP_DESK_SYSTEM',
    label: 'Help desk / tickets',
    description: 'Incoming tickets: queues and client correspondence.',
  },
];

describe('filterAndRankCodeProductTypes', () => {
  it('keeps catalog order when the query is empty', () => {
    expect(filterAndRankCodeProductTypes(OPTIONS, '  ').map((row) => row.value)).toEqual([
      'ECOMMERCE',
      'CRM',
      'CUSTOMER_PORTAL',
      'HELP_DESK_SYSTEM',
    ]);
  });

  it('ranks a name prefix, including the first letter, above a description hit', () => {
    expect(filterAndRankCodeProductTypes(OPTIONS, 'c').map((row) => row.value)).toEqual([
      'CRM',
      'CUSTOMER_PORTAL',
      'ECOMMERCE',
      'HELP_DESK_SYSTEM',
    ]);
  });

  it('ranks a name contains hit above a description-only match', () => {
    expect(filterAndRankCodeProductTypes(OPTIONS, 'клиент').map((row) => row.value)).toEqual([]);
    const russian: CodeProductTypeOption[] = [
      {
        value: 'ERP',
        label: 'ERP / ресурсы',
        description: 'Учёт закупок и клиентов на складе.',
      },
      {
        value: 'CRM',
        label: 'CRM / клиенты',
        description: 'База клиентов и сделок.',
      },
      {
        value: 'CUSTOMER_PORTAL',
        label: 'Кабинет клиента',
        description: 'Заказы и документы заказчика.',
      },
    ];
    expect(filterAndRankCodeProductTypes(russian, 'клиент').map((row) => row.value)).toEqual([
      'CRM',
      'CUSTOMER_PORTAL',
      'ERP',
    ]);
  });

  it('treats the enum code as a name field', () => {
    expect(filterAndRankCodeProductTypes(OPTIONS, 'pos').map((row) => row.value)).toEqual([]);
    expect(filterAndRankCodeProductTypes(OPTIONS, 'crm').map((row) => row.value)).toEqual(['CRM']);
  });

  it('ranks a word prefix in the name above a later substring', () => {
    expect(filterAndRankCodeProductTypes(OPTIONS, 'desk').map((row) => row.value)).toEqual([
      'HELP_DESK_SYSTEM',
    ]);
  });
});
