import type { SubscriptionReminderLanguage } from '@nbos/database';
import type { SubscriptionPaymentReminderOffsetDays } from './subscription-payment-reminder.constants';
import { formatCoverageMonthLabel } from './subscription-payment-reminder-templates';

const D10_TEMPLATES: Record<SubscriptionReminderLanguage, string> = {
  HY: `🤖 Ողջույն հարգելի գործընկեր
Հարկավոր է կատարել «{serviceName}» ծառայության վճարը՝ {month} ամսվա համար:
Կանխավ շնորհակալություն`,
  RU: `🤖 Здравствуйте, уважаемый партнёр
Необходимо оплатить сервис «{serviceName}» за {month}:
Заранее спасибо`,
  EN: `🤖 Hello, dear partner
Please pay for the service «{serviceName}» for {month}:
Thank you in advance`,
};

const D2_TEMPLATES: Record<SubscriptionReminderLanguage, string> = {
  HY: `🤖 Ողջույն հարգելի գործընկեր
Խնդրում ենք կատարել «{serviceName}» ծառայության վճարը՝ {month} ամսվա համար:
Կանխավ շնորհակալություն`,
  RU: `🤖 Здравствуйте, уважаемый партнёр
Просим оплатить сервис «{serviceName}» за {month}:
Заранее спасибо`,
  EN: `🤖 Hello, dear partner
Kindly pay for the service «{serviceName}» for {month}:
Thank you in advance`,
};

export interface RenderClientServicePaymentReminderInput {
  offsetDays: SubscriptionPaymentReminderOffsetDays;
  language: SubscriptionReminderLanguage;
  serviceName: string;
  coverageStartMonth: string | null;
}

export function renderClientServicePaymentReminderMessage(
  input: RenderClientServicePaymentReminderInput,
): string {
  const templates = input.offsetDays === 10 ? D10_TEMPLATES : D2_TEMPLATES;
  const month = formatCoverageMonthLabel(input.coverageStartMonth, input.language);
  return templates[input.language]
    .replaceAll('{serviceName}', input.serviceName)
    .replaceAll('{month}', month);
}
