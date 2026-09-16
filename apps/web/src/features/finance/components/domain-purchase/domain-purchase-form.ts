import type { DomainConnectionMode, DomainOperationStartPayload } from '@/lib/api/client-services';
import { parseOptionalAmount } from '@/features/finance/utils/client-service-form-state';

export interface DomainDraftRow {
  key: string;
  domainName: string;
  provider: string;
  ourCost: string;
  clientCharge: string;
}

export interface DomainPurchaseDraft {
  connectionMode: DomainConnectionMode;
  domains: DomainDraftRow[];
  providerAccountId: string;
  credentialLabel: string | null;
  registrantData: string;
  dnsInstructions: string;
}

let domainDraftSeq = 0;

export function createDomainDraftRow(): DomainDraftRow {
  domainDraftSeq += 1;
  return {
    key: `domain-${domainDraftSeq}`,
    domainName: '',
    provider: '',
    ourCost: '',
    clientCharge: '',
  };
}

export function emptyDomainPurchaseDraft(): DomainPurchaseDraft {
  return {
    connectionMode: 'PURCHASE',
    domains: [createDomainDraftRow()],
    providerAccountId: '',
    credentialLabel: null,
    registrantData: '',
    dnsInstructions: '',
  };
}

export function canSubmitDomainPurchase(
  draft: DomainPurchaseDraft,
  issueInvoices: boolean,
): boolean {
  const named = draft.domains.filter((row) => row.domainName.trim());
  if (named.length === 0) return false;
  if (named.some((row) => moneyInvalid(row.ourCost) || moneyInvalid(row.clientCharge))) {
    return false;
  }
  if (!issueInvoices) return true;
  if (draft.connectionMode !== 'PURCHASE') return false;
  return named.every((row) => {
    const amount = parseOptionalAmount(row.clientCharge);
    return amount != null && amount > 0;
  });
}

export function toDomainOperationPayload(
  productId: string,
  draft: DomainPurchaseDraft,
  issueInvoices: boolean,
): DomainOperationStartPayload {
  const credentialId =
    draft.connectionMode === 'CLIENT_DNS' ? null : draft.providerAccountId.trim() || null;
  return {
    productId,
    connectionMode: draft.connectionMode,
    domains: draft.domains
      .filter((row) => row.domainName.trim())
      .map((row) => ({
        domainName: row.domainName.trim(),
        provider: row.provider.trim() || null,
        ourCost: parseOptionalAmount(row.ourCost),
        clientCharge: parseOptionalAmount(row.clientCharge),
        providerAccountId: credentialId,
      })),
    registrantData:
      draft.connectionMode === 'PURCHASE' ? draft.registrantData.trim() || null : null,
    dnsInstructions:
      draft.connectionMode === 'CLIENT_DNS' ? draft.dnsInstructions.trim() || null : null,
    issueInvoices,
  };
}

function moneyInvalid(value: string): boolean {
  return Number.isNaN(parseOptionalAmount(value));
}
