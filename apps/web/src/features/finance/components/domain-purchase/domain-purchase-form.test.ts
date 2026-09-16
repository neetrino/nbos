import { describe, expect, it } from 'vitest';
import {
  canSubmitDomainPurchase,
  emptyDomainPurchaseDraft,
  toDomainOperationPayload,
} from './domain-purchase-form';

describe('domain purchase form', () => {
  it('allows a product start with names only', () => {
    const draft = emptyDomainPurchaseDraft();
    draft.domains[0]!.domainName = 'example.am';
    expect(canSubmitDomainPurchase(draft, false)).toBe(true);
    expect(canSubmitDomainPurchase(draft, true)).toBe(false);
  });

  it('requires a client amount on the invoice path', () => {
    const draft = emptyDomainPurchaseDraft();
    draft.domains[0]!.domainName = 'example.am';
    draft.domains[0]!.clientCharge = '12000';
    expect(canSubmitDomainPurchase(draft, true)).toBe(true);
    expect(toDomainOperationPayload('prod-1', draft, true).issueInvoices).toBe(true);
  });

  it('does not send a credential in the DNS scenario', () => {
    const draft = emptyDomainPurchaseDraft();
    draft.connectionMode = 'CLIENT_DNS';
    draft.providerAccountId = 'cred-1';
    draft.domains[0]!.domainName = 'example.am';
    draft.dnsInstructions = 'A @ 1.2.3.4';
    expect(
      toDomainOperationPayload('prod-1', draft, false).domains[0]?.providerAccountId,
    ).toBeNull();
  });
});
