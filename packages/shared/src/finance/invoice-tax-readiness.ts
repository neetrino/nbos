import type { StageGateError } from '../crm/attribution-gate';

export const INVOICE_TAX_READINESS_GATE_CODE = 'STAGE_GATE_VALIDATION';

export const INVOICE_TAX_GATE_FIELD = {
  COMPANY: 'company',
  COMPANY_NAME: 'companyName',
  COMPANY_TAX_ID: 'companyTaxId',
  OFFICIAL_INVOICE: 'officialInvoice',
} as const;

const COLLECTION_MONEY_STATUSES = new Set(['AWAITING_PAYMENT', 'OVERDUE']);

export interface InvoiceTaxCompanyRequisites {
  name?: string | null;
  legalName?: string | null;
  taxId?: string | null;
}

/** Official name for Tax invoices; falls back to display `name` until legalName is filled. */
export function resolveCompanyInvoiceLegalName(
  company: InvoiceTaxCompanyRequisites | null | undefined,
): string {
  return company?.legalName?.trim() || company?.name?.trim() || '';
}

export interface InvoiceTaxReadinessInput {
  taxStatus: string | null | undefined;
  currentMoneyStatus: string;
  targetMoneyStatus: string;
  companyId?: string | null;
  company?: InvoiceTaxCompanyRequisites | null;
  officialInvoiceRequestSent: boolean;
}

export function isTaxInvoiceStatus(taxStatus: string | null | undefined): boolean {
  return taxStatus === 'TAX';
}

export function isOfficialInvoiceIssued(invoice: { officialInvoiceRequestSent: boolean }): boolean {
  return invoice.officialInvoiceRequestSent === true;
}

export function companyHasInvoiceRequisites(
  company: InvoiceTaxCompanyRequisites | null | undefined,
): boolean {
  return Boolean(resolveCompanyInvoiceLegalName(company) && company?.taxId?.trim());
}

export function needsInvoiceTaxMoneyStatusGate(
  currentMoneyStatus: string,
  targetMoneyStatus: string,
): boolean {
  if (targetMoneyStatus === 'PAID') return true;
  if (COLLECTION_MONEY_STATUSES.has(targetMoneyStatus)) {
    return !COLLECTION_MONEY_STATUSES.has(currentMoneyStatus);
  }
  return false;
}

export function getCompanyInvoiceRequisiteErrors(
  company: InvoiceTaxCompanyRequisites | null | undefined,
  companyId?: string | null,
): StageGateError[] {
  if (!companyId && !company) {
    return [
      {
        field: INVOICE_TAX_GATE_FIELD.COMPANY,
        message:
          'Select a company and fill legal name and tax ID before a Tax invoice can proceed.',
      },
    ];
  }
  const errors: StageGateError[] = [];
  if (!resolveCompanyInvoiceLegalName(company)) {
    errors.push({
      field: INVOICE_TAX_GATE_FIELD.COMPANY_NAME,
      message: 'Fill the company legal name before issuing a Tax invoice.',
    });
  }
  if (!company?.taxId?.trim()) {
    errors.push({
      field: INVOICE_TAX_GATE_FIELD.COMPANY_TAX_ID,
      message: 'Fill the company tax ID (VOEN) before issuing a Tax invoice.',
    });
  }
  return errors;
}

export function getOfficialInvoiceRequestSendErrors(input: {
  taxStatus: string | null | undefined;
  companyId?: string | null;
  company?: InvoiceTaxCompanyRequisites | null;
}): StageGateError[] {
  if (!isTaxInvoiceStatus(input.taxStatus)) return [];
  return getCompanyInvoiceRequisiteErrors(input.company, input.companyId);
}

export function getInvoiceTaxMoneyStatusGateErrors(
  input: InvoiceTaxReadinessInput,
): StageGateError[] {
  if (!isTaxInvoiceStatus(input.taxStatus)) return [];
  if (!needsInvoiceTaxMoneyStatusGate(input.currentMoneyStatus, input.targetMoneyStatus)) {
    return [];
  }
  if (input.targetMoneyStatus === 'PAID') {
    if (isOfficialInvoiceIssued(input)) return [];
    return [
      {
        field: INVOICE_TAX_GATE_FIELD.OFFICIAL_INVOICE,
        message:
          'Send the official invoice request to accounting before marking a Tax invoice as Paid.',
      },
    ];
  }
  return getCompanyInvoiceRequisiteErrors(input.company, input.companyId);
}

export function shouldCancelOfficialRequestOnCardCancel(invoice: {
  taxStatus: string | null | undefined;
  officialInvoiceRequestSent: boolean;
}): boolean {
  return isTaxInvoiceStatus(invoice.taxStatus) && isOfficialInvoiceIssued(invoice);
}

export function resolveDepositInvoiceMoneyStatus(input: {
  taxStatus: string;
  company: InvoiceTaxCompanyRequisites | null;
}): 'NEW' | 'AWAITING_PAYMENT' {
  if (isTaxInvoiceStatus(input.taxStatus) && !companyHasInvoiceRequisites(input.company)) {
    return 'NEW';
  }
  return 'AWAITING_PAYMENT';
}
