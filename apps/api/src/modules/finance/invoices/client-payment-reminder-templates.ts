import type { SubscriptionReminderLanguage, TaxStatus } from '@nbos/database';
import {
  TAX_FREE_PAYMENT_ACCOUNT,
  TAX_FREE_PAYMENT_CARD,
  TAX_FREE_PAYMENT_NAME,
} from './client-payment-requisites';
import { formatAmdAmount } from './invoice-official-whatsapp-templates';
import {
  CLIENT_PAYMENT_REMINDER_PAY_WITHIN_DAYS,
  type SubscriptionPaymentReminderOffsetDays,
} from './subscription-payment-reminder.constants';

const MONTH_LOCALES: Record<SubscriptionReminderLanguage, string> = {
  HY: 'hy-AM',
  RU: 'ru-RU',
  EN: 'en-US',
};

const DATE_LOCALES: Record<SubscriptionReminderLanguage, string> = {
  HY: 'hy-AM',
  RU: 'ru-RU',
  EN: 'en-US',
};

export type ClientPaymentReminderSource = 'subscription' | 'client_service';

export interface RenderClientPaymentReminderInput {
  offsetDays?: SubscriptionPaymentReminderOffsetDays;
  language: SubscriptionReminderLanguage;
  source: ClientPaymentReminderSource;
  serviceLabel: string;
  periodLabel: string;
  invoiceCode?: string;
  amount: unknown;
  taxStatus: TaxStatus;
  coverageMonthCount?: number;
}

interface TemplateCopy {
  greeting: string;
  purpose: string;
  amountLine: string;
  taxPayByInvoice: string;
  taxFreePayBlockHeader: string;
  closing: string;
}

const COPY: Record<SubscriptionReminderLanguage, TemplateCopy> = {
  HY: {
    greeting: '🤖 Ողջույն հարգելի գործընկեր',
    purpose: `Խնդրում ենք ${CLIENT_PAYMENT_REMINDER_PAY_WITHIN_DAYS} օրվա ընթացքում կատարել «{serviceLabel}» {serviceKind} վճարը՝ {periodLabel}{periodSuffix}`,
    amountLine: 'Գումար՝ {amount} դրամ',
    taxPayByInvoice: 'Խնդրում ենք կատարել վճարումը ըստ դուրս գրված հաշվի:',
    taxFreePayBlockHeader: 'Վճարման տվյալներ՝',
    closing: 'Կանխավ շնորհակալություն',
  },
  RU: {
    greeting: '🤖 Здравствуйте, уважаемый партнёр',
    purpose: `Просим в течение ${CLIENT_PAYMENT_REMINDER_PAY_WITHIN_DAYS} дней оплатить {serviceKind} «{serviceLabel}» {periodLabel}{periodSuffix}`,
    amountLine: 'Сумма: {amount} драм',
    taxPayByInvoice: 'Пожалуйста, оплатите по выставленному счёту.',
    taxFreePayBlockHeader: 'Реквизиты для оплаты:',
    closing: 'Заранее спасибо',
  },
  EN: {
    greeting: '🤖 Hello, dear partner',
    purpose: `Please make the {serviceKind} payment for «{serviceLabel}» {periodLabel}{periodSuffix} within ${CLIENT_PAYMENT_REMINDER_PAY_WITHIN_DAYS} days`,
    amountLine: 'Amount: {amount} AMD',
    taxPayByInvoice: 'Please pay using the official invoice issued to you.',
    taxFreePayBlockHeader: 'Payment details:',
    closing: 'Thank you in advance',
  },
};

const SERVICE_KIND: Record<
  ClientPaymentReminderSource,
  Record<SubscriptionReminderLanguage, string>
> = {
  subscription: {
    HY: 'բաժանորդագրության ամենամսյա',
    RU: 'ежемесячную подписку',
    EN: 'monthly subscription',
  },
  client_service: {
    HY: 'ծառայության',
    RU: 'услугу',
    EN: 'service',
  },
};

const MULTI_PERIOD_SUBSCRIPTION_KIND: Record<SubscriptionReminderLanguage, string> = {
  HY: 'բաժանորդագրության',
  RU: 'подписку',
  EN: 'subscription',
};

export function resolveClientReminderServiceKind(
  source: ClientPaymentReminderSource,
  language: SubscriptionReminderLanguage,
  coverageMonthCount = 1,
): string {
  if (source === 'subscription' && coverageMonthCount > 1) {
    return MULTI_PERIOD_SUBSCRIPTION_KIND[language];
  }
  return SERVICE_KIND[source][language];
}

const PERIOD_SUFFIX: Record<
  ClientPaymentReminderSource,
  Record<SubscriptionReminderLanguage, string>
> = {
  subscription: {
    HY: ' ամսվա համար',
    RU: '',
    EN: '',
  },
  client_service: {
    HY: ' մինչև',
    RU: '',
    EN: '',
  },
};

export function formatCoverageMonthLabel(
  coverageStartMonth: string | null,
  language: SubscriptionReminderLanguage,
): string {
  return formatCoverageRange(coverageStartMonth, 1, language);
}

export function formatCoveragePeriodLabel(
  coverageStartMonth: string | null,
  coverageMonthCount: number | null | undefined,
  language: SubscriptionReminderLanguage,
): string {
  const count =
    typeof coverageMonthCount === 'number' &&
    Number.isInteger(coverageMonthCount) &&
    coverageMonthCount >= 1
      ? coverageMonthCount
      : 1;
  return formatCoverageRange(coverageStartMonth, count, language);
}

function formatCoverageRange(
  coverageStartMonth: string | null,
  coverageMonthCount: number,
  language: SubscriptionReminderLanguage,
): string {
  const start = parseCoverageMonthParts(coverageStartMonth, language);
  if (!start) return coverageStartMonth?.trim() || '';
  if (coverageMonthCount <= 1) return withPeriodPrefix(start.label, language);
  const endKey = shiftCoverageMonthKey(start.key, coverageMonthCount - 1);
  const end = parseCoverageMonthParts(endKey, language);
  if (!end) return withPeriodPrefix(start.label, language);
  const range =
    start.year === end.year
      ? `${start.monthName}–${end.monthName} ${end.year}`
      : `${start.monthName} ${start.year}–${end.monthName} ${end.year}`;
  return withPeriodPrefix(range, language);
}

function parseCoverageMonthParts(
  coverageStartMonth: string | null,
  language: SubscriptionReminderLanguage,
): { key: string; monthName: string; year: number; label: string } | null {
  if (!coverageStartMonth || !/^\d{4}-\d{2}$/.test(coverageStartMonth)) return null;
  const year = Number(coverageStartMonth.slice(0, 4));
  const monthIndex = Number(coverageStartMonth.slice(5, 7)) - 1;
  const monthName = new Intl.DateTimeFormat(MONTH_LOCALES[language], {
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, monthIndex, 1)));
  return {
    key: coverageStartMonth,
    monthName,
    year,
    label: `${monthName} ${year}`,
  };
}

function shiftCoverageMonthKey(monthKey: string, deltaMonths: number): string {
  const year = Number(monthKey.slice(0, 4));
  const monthIndex = Number(monthKey.slice(5, 7)) - 1 + deltaMonths;
  const shifted = new Date(Date.UTC(year, monthIndex, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}`;
}

function withPeriodPrefix(label: string, language: SubscriptionReminderLanguage): string {
  if (language === 'HY') return label;
  if (language === 'RU') return `за ${label}`;
  return `for ${label}`;
}

export function formatDueDateLabel(dueDate: Date, language: SubscriptionReminderLanguage): string {
  const formatted = new Intl.DateTimeFormat(DATE_LOCALES[language], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Yerevan',
  }).format(dueDate);
  if (language === 'HY') return formatted;
  if (language === 'RU') return `до ${formatted}`;
  return `by ${formatted}`;
}

function fillTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

function buildTaxFreePayBlock(language: SubscriptionReminderLanguage): string {
  const copy = COPY[language];
  return [
    copy.taxFreePayBlockHeader,
    `💳 ${TAX_FREE_PAYMENT_CARD}`,
    `🏦 ${TAX_FREE_PAYMENT_ACCOUNT}`,
    `👤 ${TAX_FREE_PAYMENT_NAME}`,
  ].join('\n');
}

export function renderClientPaymentReminderMessage(
  input: RenderClientPaymentReminderInput,
): string {
  const copy = COPY[input.language];
  const purposeTemplate = copy.purpose;
  const closing = copy.closing;
  const serviceKind = resolveClientReminderServiceKind(
    input.source,
    input.language,
    input.coverageMonthCount ?? 1,
  );
  const periodSuffix = PERIOD_SUFFIX[input.source][input.language];

  const purpose = fillTemplate(purposeTemplate, {
    serviceLabel: input.serviceLabel,
    serviceKind,
    periodLabel: input.periodLabel,
    periodSuffix,
  });
  const amountLine = fillTemplate(copy.amountLine, {
    amount: formatAmdAmount(input.amount),
  });

  const lines = [copy.greeting, purpose];
  if (input.invoiceCode?.trim()) {
    lines.push(input.invoiceCode.trim());
  }
  lines.push(amountLine);
  if (input.taxStatus === 'TAX_FREE') {
    lines.push(buildTaxFreePayBlock(input.language));
  } else {
    lines.push(copy.taxPayByInvoice);
  }
  lines.push(closing);
  return lines.join('\n');
}
