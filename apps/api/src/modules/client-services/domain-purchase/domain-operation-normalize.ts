import { BadRequestException } from '@nestjs/common';
import { DOMAIN_DNS_INSTRUCTIONS_MAX_LENGTH, DOMAIN_OPERATION_MAX_DOMAINS } from '@nbos/shared';
import { normalizeDomainName } from '../registry/domain-name';
import {
  DOMAIN_CREDENTIAL_FORBIDDEN_FOR_DNS,
  DOMAIN_INVOICE_AMOUNT_REQUIRED,
  DOMAIN_INVOICE_FORBIDDEN_FOR_NON_PURCHASE,
  DOMAIN_NAME_INVALID,
  DOMAIN_PRODUCT_REQUIRED,
} from './domain-operation.errors';
import { requireDomainConnectionMode } from './domain-connection-mode';
import type {
  DomainOperationDomainInput,
  StartDomainOperationBody,
} from './domain-operation.types';

export interface NormalizedDomainOperation {
  productId: string;
  connectionMode: ReturnType<typeof requireDomainConnectionMode>;
  domains: Array<DomainOperationDomainInput & { domainName: string }>;
  dnsInstructions: string | null;
  registrantData: string | null;
  issueInvoices: boolean;
}

export function normalizeStartDomainOperationBody(
  body: StartDomainOperationBody,
): NormalizedDomainOperation {
  const productId = body.productId?.trim();
  if (!productId) throw new BadRequestException(DOMAIN_PRODUCT_REQUIRED);

  const connectionMode = requireDomainConnectionMode(body.connectionMode);
  const domains = normalizeDomainInputs(body.domains);
  const issueInvoices = Boolean(body.issueInvoices);
  assertInvoicePath(connectionMode, issueInvoices, domains);
  assertDnsCredentialRules(connectionMode, domains);

  return {
    productId,
    connectionMode,
    domains,
    dnsInstructions: normalizeDnsInstructions(body.dnsInstructions, connectionMode),
    registrantData: body.registrantData?.trim() || null,
    issueInvoices,
  };
}

function normalizeDomainInputs(
  domains: DomainOperationDomainInput[] | undefined,
): Array<DomainOperationDomainInput & { domainName: string }> {
  if (!domains?.length) throw new BadRequestException('Add at least one domain.');
  if (domains.length > DOMAIN_OPERATION_MAX_DOMAINS) {
    throw new BadRequestException(`At most ${DOMAIN_OPERATION_MAX_DOMAINS} domains per action.`);
  }
  const seen = new Set<string>();
  return domains.map((domain) => {
    const domainName = normalizeDomainName(domain.domainName ?? '');
    if (!domainName) throw new BadRequestException(DOMAIN_NAME_INVALID);
    if (seen.has(domainName)) {
      throw new BadRequestException(`Duplicate domain in this request: ${domainName}`);
    }
    seen.add(domainName);
    return { ...domain, domainName };
  });
}

function assertInvoicePath(
  mode: ReturnType<typeof requireDomainConnectionMode>,
  issueInvoices: boolean,
  domains: DomainOperationDomainInput[],
): void {
  if (!issueInvoices) return;
  if (mode !== 'PURCHASE') {
    throw new BadRequestException(DOMAIN_INVOICE_FORBIDDEN_FOR_NON_PURCHASE);
  }
  for (const domain of domains) {
    if (
      domain.clientCharge == null ||
      !Number.isFinite(domain.clientCharge) ||
      domain.clientCharge <= 0
    ) {
      throw new BadRequestException(DOMAIN_INVOICE_AMOUNT_REQUIRED);
    }
  }
}

function assertDnsCredentialRules(
  mode: ReturnType<typeof requireDomainConnectionMode>,
  domains: DomainOperationDomainInput[],
): void {
  if (mode !== 'CLIENT_DNS') return;
  if (domains.some((domain) => domain.providerAccountId?.trim())) {
    throw new BadRequestException(DOMAIN_CREDENTIAL_FORBIDDEN_FOR_DNS);
  }
}

function normalizeDnsInstructions(
  value: string | null | undefined,
  mode: ReturnType<typeof requireDomainConnectionMode>,
): string | null {
  const trimmed = value?.trim() || null;
  if (!trimmed) return null;
  if (trimmed.length > DOMAIN_DNS_INSTRUCTIONS_MAX_LENGTH) {
    throw new BadRequestException('DNS instructions exceed the allowed length');
  }
  if (mode !== 'CLIENT_DNS') return trimmed;
  return trimmed;
}
