import { resolveInvoiceDisplayTitle, resolveInvoiceOrderCommentLabelHy } from '@nbos/shared';
import { formatCoverageMonthLabel, formatDueDateLabel } from './client-payment-reminder-templates';

const SUBSCRIPTION_TYPE_PHRASE_HY: Record<string, string> = {
  DEV_ONLY: 'մշակում',
  MAINTENANCE_ONLY: 'տեխսպասարկում',
  DEV_AND_MAINTENANCE: 'մշակում և տեխսպասարկում',
  PARTNER_SERVICE: 'գործընկերային ծառայություն',
};

const CLIENT_SERVICE_TYPE_PHRASE_HY: Record<string, string> = {
  DOMAIN: 'դոմեն',
  HOSTING: 'հոսթինգ',
  LICENSE: 'լիցենզիա',
  ACCOUNT: 'հաշիվ',
  SERVICE: 'ծառայություն',
};

export type OfficialInvoiceNoteSource = 'order' | 'subscription' | 'client_service' | 'fallback';

export function resolveOfficialInvoiceNoteSource(input: {
  orderId?: string | null;
  clientServiceRecordId?: string | null;
  subscriptionId?: string | null;
}): OfficialInvoiceNoteSource {
  if (input.orderId) return 'order';
  if (input.clientServiceRecordId) return 'client_service';
  if (input.subscriptionId) return 'subscription';
  return 'fallback';
}

export interface OfficialInvoiceNoteInput {
  code: string;
  orderId?: string | null;
  subscriptionId?: string | null;
  clientServiceRecordId?: string | null;
  orderComment?: string | null;
  orderCode?: string | null;
  dealName?: string | null;
  dealCode?: string | null;
  subscriptionName?: string | null;
  subscriptionCode?: string | null;
  subscriptionType?: string | null;
  coverageStartMonth?: string | null;
  clientServiceName?: string | null;
  clientServiceType?: string | null;
  dueDate?: Date | string | null;
}

export function buildOfficialInvoicePurpose(input: OfficialInvoiceNoteInput): string {
  const source = resolveOfficialInvoiceNoteSource(input);
  if (source === 'order') {
    return joinNoteLines([
      resolveNoteDisplayTitle(input),
      resolveInvoiceOrderCommentLabelHy(input.orderComment),
      input.code,
    ]);
  }
  if (source === 'subscription') {
    const name = input.subscriptionName?.trim() || resolveNoteDisplayTitle(input);
    const phrase = phraseFor(SUBSCRIPTION_TYPE_PHRASE_HY, input.subscriptionType);
    const month = formatCoverageMonthLabel(input.coverageStartMonth ?? null, 'HY');
    return joinNoteLines([name, joinWhy(phrase, month), input.code]);
  }
  if (source === 'client_service') {
    const name = input.clientServiceName?.trim() || resolveNoteDisplayTitle(input);
    const phrase = phraseFor(CLIENT_SERVICE_TYPE_PHRASE_HY, input.clientServiceType);
    const due = formatOfficialDueUntil(input.dueDate);
    return joinNoteLines([name, joinWhy(phrase, due), input.code]);
  }
  return joinNoteLines([resolveNoteDisplayTitle(input), input.code]);
}

function resolveNoteDisplayTitle(input: OfficialInvoiceNoteInput): string {
  return resolveInvoiceDisplayTitle({
    code: input.code,
    order:
      input.orderId || input.orderCode || input.dealName || input.dealCode
        ? {
            code: input.orderCode?.trim() || input.code,
            deal:
              input.dealName || input.dealCode
                ? { name: input.dealName ?? null, code: input.dealCode?.trim() || input.code }
                : null,
          }
        : null,
    subscription:
      input.subscriptionName || input.subscriptionCode
        ? {
            name: input.subscriptionName ?? null,
            code: input.subscriptionCode?.trim() || input.code,
          }
        : null,
  });
}

function formatOfficialDueUntil(dueDate?: Date | string | null): string {
  if (dueDate == null || dueDate === '') return '';
  const date = dueDate instanceof Date ? dueDate : new Date(dueDate);
  if (Number.isNaN(date.getTime())) return '';
  return `մինչև ${formatDueDateLabel(date, 'HY')}`;
}

function phraseFor(map: Record<string, string>, type?: string | null): string {
  if (!type) return '';
  return map[type] ?? '';
}

function joinWhy(phrase: string, period: string): string | null {
  if (phrase && period) return `${phrase}, ${period}`;
  return phrase || period || null;
}

function joinNoteLines(lines: Array<string | null | undefined>): string {
  return lines
    .map((line) => line?.trim())
    .filter((line): line is string => Boolean(line))
    .join('\n');
}
