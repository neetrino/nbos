import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { normalizeStartDomainOperationBody } from './domain-operation-normalize';

describe('normalizeStartDomainOperationBody', () => {
  it('allows product start with domain names only', () => {
    const result = normalizeStartDomainOperationBody({
      productId: 'prod-1',
      connectionMode: 'PURCHASE',
      domains: [{ domainName: 'Example.AM' }, { domainName: 'www.other.com' }],
    });
    expect(result.domains.map((row) => row.domainName)).toEqual(['example.am', 'other.com']);
    expect(result.issueInvoices).toBe(false);
  });

  it('requires a client amount when issuing invoices', () => {
    expect(() =>
      normalizeStartDomainOperationBody({
        productId: 'prod-1',
        connectionMode: 'PURCHASE',
        issueInvoices: true,
        domains: [{ domainName: 'example.am' }],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects a credential on the client-DNS path', () => {
    expect(() =>
      normalizeStartDomainOperationBody({
        productId: 'prod-1',
        connectionMode: 'CLIENT_DNS',
        domains: [{ domainName: 'example.am', providerAccountId: 'cred-1' }],
      }),
    ).toThrow(BadRequestException);
  });
});
