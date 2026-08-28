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
  amount: unknown;
  taxStatus: TaxStatus;
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
  if (!coverageStartMonth || !/^\d{4}-\d{2}$/.test(coverageStartMonth)) {
    return coverageStartMonth?.trim() || '';
  }
  const [yearRaw, monthRaw] = coverageStartMonth.split('-');
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  const date = new Date(Date.UTC(year, monthIndex, 1));
  const monthName = new Intl.DateTimeFormat(MONTH_LOCALES[language], {
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
  if (language === 'HY') return `${monthName} ${year}`;
  if (language === 'RU') return `за ${monthName} ${year}`;
  return `for ${monthName} ${year}`;
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
  const serviceKind = SERVICE_KIND[input.source][input.language];
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

  const lines = [copy.greeting, purpose, amountLine];
  if (input.taxStatus === 'TAX_FREE') {
    lines.push(buildTaxFreePayBlock(input.language));
  } else {
    lines.push(copy.taxPayByInvoice);
  }
  lines.push(closing);
  return lines.join('\n');
}
