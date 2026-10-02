import type { SubscriptionReminderLanguage, TaxStatus } from '@nbos/database';
import { formatAmdAmount } from './invoice-official-whatsapp-templates';
import type { ClientPaymentReminderSource } from './client-payment-reminder-templates';
import type { OverdueReminderWave } from './invoice-overdue-reminder.constants';

export interface RenderOverdueReminderInput {
  wave: OverdueReminderWave;
  language: SubscriptionReminderLanguage;
  source: ClientPaymentReminderSource;
  serviceLabel: string;
  periodLabel: string;
  invoiceCode?: string;
  amount: unknown;
  taxStatus: TaxStatus;
  coverageMonthCount?: number;
}

interface OverdueTemplateCopy {
  greeting: string;
  purposeW1: string;
  purposeW2: string;
  amountLine: string;
  taxPayByInvoice: string;
  writeIfProblem: string;
  closing: string;
}

const COPY: Record<SubscriptionReminderLanguage, OverdueTemplateCopy> = {
  HY: {
    greeting: '🤖 Ողջույն հարգելի գործընկեր',
    purposeW1: 'Վճարման ժամկետը լրացել է։ Խնդրում ենք կատարել «{serviceLabel}» ամենամսյա վճարը։',
    purposeW2: 'Վճարումը դեռևս չի ստացվել։ Խնդրում ենք մարել «{serviceLabel}» ամենամսյա վճարը։',
    amountLine: 'Գումար՝ {amount} դրամ',
    taxPayByInvoice: 'Խնդրում ենք կատարել վճարումը ըստ դուրս գրված հաշվի։',
    writeIfProblem:
      'Եթե կա խնդիր վճարման հետ կապված, խնդրում ենք անպայման գրեք մեզ՝ անջատումից խուսափելու համար։',
    closing: 'Կանխավ շնորհակալություն',
  },
  RU: {
    greeting: '🤖 Здравствуйте, уважаемый партнёр',
    purposeW1: 'Срок оплаты прошёл. Просим оплатить ежемесячный платёж «{serviceLabel}».',
    purposeW2: 'Оплата всё ещё не поступила. Просим погасить ежемесячный платёж «{serviceLabel}».',
    amountLine: 'Сумма: {amount} драм',
    taxPayByInvoice: 'Пожалуйста, оплатите по выставленному счёту.',
    writeIfProblem:
      'Если есть проблема с оплатой, обязательно напишите нам, чтобы избежать отключения.',
    closing: 'Заранее спасибо',
  },
  EN: {
    greeting: '🤖 Hello, dear partner',
    purposeW1: 'The due date has passed. Please make the monthly payment for «{serviceLabel}».',
    purposeW2:
      'Payment has still not been received. Please settle the monthly payment for «{serviceLabel}».',
    amountLine: 'Amount: {amount} AMD',
    taxPayByInvoice: 'Please pay using the official invoice issued to you.',
    writeIfProblem:
      'If there is a problem with the payment, please write to us so we can avoid a disconnection.',
    closing: 'Thank you in advance',
  },
};

export function renderOverdueReminderMessage(input: RenderOverdueReminderInput): string {
  const copy = COPY[input.language];
  const purposeTemplate = input.wave === 1 ? copy.purposeW1 : copy.purposeW2;
  const purpose = fillTemplate(purposeTemplate, { serviceLabel: input.serviceLabel });
  const amountLine = fillTemplate(copy.amountLine, { amount: formatAmdAmount(input.amount) });
  const lines = [copy.greeting, purpose];
  if (input.invoiceCode?.trim()) lines.push(input.invoiceCode.trim());
  lines.push(amountLine, copy.taxPayByInvoice, copy.writeIfProblem, copy.closing);
  return lines.join('\n');
}

function fillTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}
