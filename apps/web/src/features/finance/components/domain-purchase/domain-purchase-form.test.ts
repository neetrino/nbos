import { describe, expect, it } from 'vitest';
import {
  canSubmitDomainPurchase,
  emptyDomainPurchaseDraft,
  removeDomainDraftRow,
  toDomainOperationPayload,
} from './domain-purchase-form';

describe('domain purchase form', () => {
  it('allows a product start with names only', () => {
    const draft = emptyDomainPurchaseDraft();
    draft.domains[0]!.domainName = 'example.am';
    expect(canSubmitDomainPurchase(draft, false)).toBe(true);
    expect(canSubmitDomainPurchase(draft, true)).toBe(false);
  });

  it('uses one AMD cost for invoice and provider amounts', () => {
    const draft = emptyDomainPurchaseDraft();
    draft.domains[0]!.domainName = 'example.am';
    draft.domains[0]!.costAmd = '12000';
    expect(canSubmitDomainPurchase(draft, true)).toBe(true);
    const payload = toDomainOperationPayload('prod-1', draft, true);
    expect(payload.issueInvoices).toBe(true);
    expect(payload.domains[0]?.ourCost).toBe(12000);
    expect(payload.domains[0]?.clientCharge).toBe(12000);
  });

  it('does not send a credential in the DNS scenario', () => {
    const draft = emptyDomainPurchaseDraft();
    draft.connectionMode = 'CLIENT_DNS';
    draft.providerAccountId = 'cred-1';
    draft.domains[0]!.domainName = 'example.am';
    expect(
      toDomainOperationPayload('prod-1', draft, false).domains[0]?.providerAccountId,
    ).toBeNull();
  });

  it('removes only the selected draft row', () => {
    const draft = emptyDomainPurchaseDraft();
    draft.domains[0]!.domainName = 'one.am';
    draft.domains.push({
      key: 'domain-keep',
      domainName: 'two.am',
      provider: '',
      costAmd: '10',
    });
    const next = removeDomainDraftRow(draft, draft.domains[0]!.key);
    expect(next.domains).toHaveLength(1);
    expect(next.domains[0]?.domainName).toBe('two.am');
    expect(next.domains[0]?.costAmd).toBe('10');
  });
});
