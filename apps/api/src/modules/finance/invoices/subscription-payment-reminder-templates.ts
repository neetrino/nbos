import type { SubscriptionReminderLanguage } from '@nbos/database';
import type { SubscriptionPaymentReminderOffsetDays } from './subscription-payment-reminder.constants';

const MONTH_LOCALES: Record<SubscriptionReminderLanguage, string> = {
  HY: 'hy-AM',
  RU: 'ru-RU',
  EN: 'en-US',
};

const D10_TEMPLATES: Record<SubscriptionReminderLanguage, string> = {
  HY: `🤖 Ողջույն հարգելի գործընկեր
Հարկավոր է կատարել «{productName}» բաժանորդագրության ամենամսյա վճարը՝ {month} ամսվա համար:
Կանխավ շնորհակալություն`,
  RU: `🤖 Здравствуйте, уважаемый партнёр
Необходимо оплатить ежемесячную подписку «{productName}» за {month}:
Заранее спасибо`,
  EN: `🤖 Hello, dear partner
Please make the monthly subscription payment for «{productName}» for {month}:
Thank you in advance`,
};

const D2_TEMPLATES: Record<SubscriptionReminderLanguage, string> = {
  HY: `🤖 Ողջույն հարգելի գործընկեր
Խնդրում ենք կատարել «{productName}» ամենամսյա վճարը՝ {month} ամսվա համար:
Կանխավ շնորհակալություն`,
  RU: `🤖 Здравствуйте, уважаемый партнёр
Просим оплатить ежемесячный платёж за «{productName}» за {month}:
Заранее спасибо`,
  EN: `🤖 Hello, dear partner
Kindly make the monthly payment for «{productName}» for {month}:
Thank you in advance`,
};

export interface RenderSubscriptionPaymentReminderInput {
  offsetDays: SubscriptionPaymentReminderOffsetDays;
  language: SubscriptionReminderLanguage;
  productName: string;
  /** YYYY-MM coverage month from Invoice.coverageStartMonth */
  coverageStartMonth: string | null;
}

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
  return `${monthName} ${year}`;
}

export function renderSubscriptionPaymentReminderMessage(
  input: RenderSubscriptionPaymentReminderInput,
): string {
  const templates = input.offsetDays === 10 ? D10_TEMPLATES : D2_TEMPLATES;
  const template = templates[input.language];
  const month = formatCoverageMonthLabel(input.coverageStartMonth, input.language);
  return template.replaceAll('{productName}', input.productName).replaceAll('{month}', month);
}
