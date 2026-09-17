import type { DomainConnectionMode, DomainOperationStartPayload } from '@/lib/api/client-services';
import { parseOptionalAmount } from '@/features/finance/utils/client-service-form-state';
import type { ClientServiceRecord } from '@/lib/api/client-services';

export interface DomainDraftRow {
  key: string;
  domainName: string;
  provider: string;
  costAmd: string;
  serviceId?: string;
}

export interface DomainPurchaseDraft {
  connectionMode: DomainConnectionMode;
  domains: DomainDraftRow[];
  providerAccountId: string;
  credentialLabel: string | null;
  registrantData: string;
}

let domainDraftSeq = 0;

export function createDomainDraftRow(): DomainDraftRow {
  domainDraftSeq += 1;
  return {
    key: `domain-${domainDraftSeq}`,
    domainName: '',
    provider: '',
    costAmd: '',
  };
}

export function emptyDomainPurchaseDraft(): DomainPurchaseDraft {
  return {
    connectionMode: 'PURCHASE',
    domains: [createDomainDraftRow()],
    providerAccountId: '',
    credentialLabel: null,
    registrantData: '',
  };
}

export function draftFromExistingServices(
  services: readonly ClientServiceRecord[],
): DomainPurchaseDraft {
  const active = services.filter((row) => row.status !== 'CANCELLED');
  if (active.length === 0) return emptyDomainPurchaseDraft();
  const first = active[0]!;
  const mode =
    first.connectionMode === 'EXISTING_ACCESS' || first.connectionMode === 'CLIENT_DNS'
      ? first.connectionMode
      : 'PURCHASE';
  return {
    connectionMode: mode,
    domains: active.map((row) => {
      domainDraftSeq += 1;
      return {
        key: `existing-${row.id}-${domainDraftSeq}`,
        domainName: row.name,
        provider: row.provider ?? '',
        costAmd: row.clientCharge ?? row.ourCost ?? '',
        serviceId: row.id,
      };
    }),
    providerAccountId: first.providerAccountId ?? '',
    credentialLabel: first.providerAccount?.name ?? null,
    registrantData: '',
  };
}

export function removeDomainDraftRow(draft: DomainPurchaseDraft, key: string): DomainPurchaseDraft {
  if (draft.domains.length <= 1) return draft;
  return { ...draft, domains: draft.domains.filter((row) => row.key !== key) };
}

export function canSubmitDomainPurchase(
  draft: DomainPurchaseDraft,
  requireAmount: boolean,
): boolean {
  const named = draft.domains.filter((row) => row.domainName.trim());
  if (named.length === 0) return false;
  if (named.some((row) => moneyInvalid(row.costAmd))) return false;
  if (!requireAmount) return true;
  if (draft.connectionMode !== 'PURCHASE') return false;
  return named.every((row) => {
    const amount = parseOptionalAmount(row.costAmd);
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
      .map((row) => {
        const amount = parseOptionalAmount(row.costAmd);
        return {
          domainName: row.domainName.trim(),
          provider: row.provider.trim() || null,
          ourCost: amount,
          clientCharge: amount,
          providerAccountId: credentialId,
        };
      }),
    registrantData:
      draft.connectionMode === 'PURCHASE' ? draft.registrantData.trim() || null : null,
    issueInvoices,
  };
}

function moneyInvalid(value: string): boolean {
  return Number.isNaN(parseOptionalAmount(value));
}
