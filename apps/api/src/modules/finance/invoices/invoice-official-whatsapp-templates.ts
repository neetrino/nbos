import type { InvoiceTypeEnum } from '@nbos/database';
import { formatCoverageMonthLabel } from './subscription-payment-reminder-templates';

const ISSUE_MARK = '✅✅✅✅';
const CANCEL_MARK = '❌❌❌❌';

export interface OfficialInvoiceWhatsAppFields {
  code: string;
  type: InvoiceTypeEnum;
  amount: unknown;
  companyName: string;
  companyTaxId: string;
  purpose: string;
}

export function buildOfficialInvoicePurpose(input: {
  type: InvoiceTypeEnum;
  code: string;
  productName?: string | null;
  coverageStartMonth?: string | null;
  clientServiceName?: string | null;
  projectName?: string | null;
  orderCode?: string | null;
}): string {
  if (input.type === 'SUBSCRIPTION') {
    const month = formatCoverageMonthLabel(input.coverageStartMonth ?? null, 'HY');
    const product = input.productName?.trim() || input.code;
    return month ? `«${product}» — ${month}` : product;
  }
  if (input.type === 'DOMAIN' || input.type === 'SERVICE') {
    return input.clientServiceName?.trim() || input.projectName?.trim() || input.code;
  }
  if (input.type === 'DEVELOPMENT' || input.type === 'EXTENSION') {
    return input.projectName?.trim() || input.orderCode?.trim() || input.code;
  }
  return input.code;
}

export function renderOfficialInvoiceIssueMessage(fields: OfficialInvoiceWhatsAppFields): string {
  return [
    ISSUE_MARK,
    `Խնդրում եմ դուրս գրել հաշիվ ID${fields.code}`,
    '',
    'Իրավաբանական տեղեկություն՝',
    fields.companyTaxId,
    fields.companyName,
    '',
    'Նշում՝',
    fields.purpose,
    '----------',
    `Գումար՝ ${formatAmdAmount(fields.amount)} դրամ`,
  ].join('\n');
}

export function renderOfficialInvoiceCancelMessage(fields: OfficialInvoiceWhatsAppFields): string {
  return [
    `Խնդրում եմ այս հաշիվը չեղարկել ID${fields.code}`,
    CANCEL_MARK,
    '',
    'Իրավաբանական տեղեկություն՝',
    fields.companyTaxId,
    fields.companyName,
    '',
    'Նշում՝',
    fields.purpose,
    '----------',
    `Գումար՝ ${formatAmdAmount(fields.amount)} դրամ`,
  ].join('\n');
}

const AMD_THOUSANDS_SEPARATOR = '.';
const AMD_DECIMAL_SEPARATOR = ',';

export function formatAmdAmount(amount: unknown): string {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return String(amount ?? '');
  const sign = numeric < 0 ? '-' : '';
  const absolute = Math.abs(numeric);
  if (Number.isInteger(numeric)) {
    return `${sign}${groupAmdIntegerDigits(String(absolute))}`;
  }
  const [whole = '0', fraction = '00'] = absolute.toFixed(2).split('.');
  return `${sign}${groupAmdIntegerDigits(whole)}${AMD_DECIMAL_SEPARATOR}${fraction}`;
}

function groupAmdIntegerDigits(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, AMD_THOUSANDS_SEPARATOR);
}

export function resolveOfficialCompanyName(
  company: {
    name: string;
    legalName: string | null;
  } | null,
): string {
  return company?.legalName?.trim() || company?.name?.trim() || '';
}
