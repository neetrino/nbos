import { describe, expect, it } from 'vitest';
import {
  resolveInvoiceDisplaySubtitle,
  resolveInvoiceDisplayTitle,
  resolveOrderDisplayTitle,
} from './invoice-display-title';

describe('resolveInvoiceDisplayTitle', () => {
  it('uses deal name before subscription, client service, product, and codes', () => {
    expect(
      resolveInvoiceDisplayTitle({
        code: 'INV-2026-0138',
        order: {
          code: 'ORD-1',
          deal: { name: 'SEO Qualitech', code: 'D-1' },
        },
        product: { name: 'Site' },
      }),
    ).toBe('SEO Qualitech');
    expect(
      resolveInvoiceDisplayTitle({
        code: 'INV-1',
        subscription: { name: 'Acme maintenance', code: 'SUB-1' },
        product: { name: 'Site' },
      }),
    ).toBe('Acme maintenance');
    expect(resolveInvoiceDisplayTitle({ code: 'INV-1' })).toBe('INV-1');
  });

  it('uses product name for an order without a deal name', () => {
    expect(
      resolveOrderDisplayTitle({
        code: 'ORD-1',
        product: { name: 'Website rebuild' },
      }),
    ).toBe('Website rebuild');
    expect(
      resolveInvoiceDisplayTitle({
        code: 'INV-1',
        order: { code: 'ORD-1' },
        product: { name: 'Website rebuild' },
      }),
    ).toBe('Website rebuild');
  });

  it('uses extension name when the order has no deal or product name', () => {
    expect(
      resolveOrderDisplayTitle({
        code: 'ORD-1',
        extension: { name: 'Blog module' },
      }),
    ).toBe('Blog module');
  });

  it('uses client service name when invoice has no order or subscription', () => {
    expect(
      resolveInvoiceDisplayTitle({
        code: 'INV-2026-0146',
        clientServiceRecord: { name: 'borboraqua.am' },
        product: { name: 'Hosting' },
      }),
    ).toBe('borboraqua.am');
  });

  it('falls back to product name, then invoice code, for a blank client service name', () => {
    expect(
      resolveInvoiceDisplayTitle({
        code: 'INV-2026-0146',
        clientServiceRecord: { name: '   ', product: { name: 'Hosting' } },
      }),
    ).toBe('Hosting');
    expect(
      resolveInvoiceDisplayTitle({
        code: 'INV-2026-0146',
        clientServiceRecord: { name: '   ' },
      }),
    ).toBe('INV-2026-0146');
  });

  it('uses linked product name for a manual invoice', () => {
    expect(
      resolveInvoiceDisplayTitle({
        code: 'INV-2026-0164',
        product: { name: 'Qualitech SEO' },
      }),
    ).toBe('Qualitech SEO');
  });

  it('prefers subscription name over client service and product names', () => {
    expect(
      resolveInvoiceDisplayTitle({
        code: 'INV-1',
        subscription: { name: 'Acme maintenance', code: 'SUB-1' },
        clientServiceRecord: { name: 'borboraqua.am' },
        product: { name: 'Site' },
      }),
    ).toBe('Acme maintenance');
  });

  it('prefers subscription name over a nameless order', () => {
    expect(
      resolveInvoiceDisplayTitle({
        code: 'INV-1',
        order: { code: 'ORD-1' },
        subscription: { name: 'Acme maintenance', code: 'SUB-1' },
      }),
    ).toBe('Acme maintenance');
  });

  it('returns invoice code as subtitle when title comes from a source', () => {
    expect(
      resolveInvoiceDisplaySubtitle({
        code: 'INV-2026-0138',
        order: { code: 'ORD-1', deal: { name: 'SEO Qualitech', code: 'D-1' } },
      }),
    ).toBe('INV-2026-0138');
    expect(
      resolveInvoiceDisplaySubtitle({
        code: 'INV-2026-0164',
        product: { name: 'Qualitech SEO' },
      }),
    ).toBe('INV-2026-0164');
    expect(resolveInvoiceDisplaySubtitle({ code: 'INV-1' })).toBeUndefined();
  });
});
