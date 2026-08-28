import type { SubscriptionReminderLanguage, TaxStatus } from '@nbos/database';
import {
  TAX_FREE_PAYMENT_ACCOUNT,
  TAX_FREE_PAYMENT_CARD,
  TAX_FREE_PAYMENT_NAME,
} from './client-payment-requisites';
import { formatAmdAmount } from './invoice-official-whatsapp-templates';
import type { ClientPaymentReminderSource } from './client-payment-reminder-templates';
import type { OverdueReminderWave } from './invoice-overdue-reminder.constants';

export interface RenderOverdueReminderInput {
  wave: OverdueReminderWave;
  language: SubscriptionReminderLanguage;
  source: ClientPaymentReminderSource;
  serviceLabel: string;
  periodLabel: string;
  amount: unknown;
  taxStatus: TaxStatus;
}

interface OverdueTemplateCopy {
  greeting: string;
  purposeW1: string;
  purposeW2: string;
  amountLine: string;
  taxPayByInvoice: string;
  taxFreePayBlockHeader: string;
  writeIfProblem: string;
  closing: string;
}

const COPY: Record<SubscriptionReminderLanguage, OverdueTemplateCopy> = {
  HY: {
    greeting: '🤖 Ողջույն հարգելի գործընկեր',
    purposeW1:
      'Վճարման ժամկետը լրացել է։ Խնդրում ենք կատարել «{serviceLabel}» {serviceKind} վճարը՝ {periodLabel}{periodSuffix}',
    purposeW2:
      'Վճարումը դեռևս չի ստացվել։ Խնդրում ենք մարել «{serviceLabel}» {serviceKind} վճարը՝ {periodLabel}{periodSuffix}',
    amountLine: 'Գումար՝ {amount} դրամ',
    taxPayByInvoice: 'Խնդրում ենք կատարել վճարումը ըստ դուրս գրված հաշվի:',
    taxFreePayBlockHeader: 'Վճարման տվյալներ՝',
    writeIfProblem:
      'Եթե կա խնդիր վճարման հետ կապված, խնդրում ենք անպայման գրեք մեզ՝ անջատումից խուսափելու համար։',
    closing: 'Կանխավ շնորհակալություն',
  },
  RU: {
    greeting: '🤖 Здравствуйте, уважаемый партнёр',
    purposeW1:
      'Срок оплаты прошёл. Просим оплатить {serviceKind} «{serviceLabel}» {periodLabel}{periodSuffix}',
    purposeW2:
      'Оплата всё ещё не поступила. Просим погасить {serviceKind} «{serviceLabel}» {periodLabel}{periodSuffix}',
    amountLine: 'Сумма: {amount} драм',
    taxPayByInvoice: 'Пожалуйста, оплатите по выставленному счёту.',
    taxFreePayBlockHeader: 'Реквизиты для оплаты:',
    writeIfProblem:
      'Если есть проблема с оплатой, обязательно напишите нам, чтобы избежать отключения.',
    closing: 'Заранее спасибо',
  },
  EN: {
    greeting: '🤖 Hello, dear partner',
    purposeW1:
      'The due date has passed. Please pay the {serviceKind} «{serviceLabel}» {periodLabel}{periodSuffix}',
    purposeW2:
      'Payment has still not been received. Please settle the {serviceKind} «{serviceLabel}» {periodLabel}{periodSuffix}',
    amountLine: 'Amount: {amount} AMD',
    taxPayByInvoice: 'Please pay using the official invoice issued to you.',
    taxFreePayBlockHeader: 'Payment details:',
    writeIfProblem:
      'If there is a problem with the payment, please write to us so we can avoid a disconnection.',
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
  subscription: { HY: ' ամսվա համար', RU: '', EN: '' },
  client_service: { HY: ' մինչև', RU: '', EN: '' },
};

export function renderOverdueReminderMessage(input: RenderOverdueReminderInput): string {
  const copy = COPY[input.language];
  const purposeTemplate = input.wave === 1 ? copy.purposeW1 : copy.purposeW2;
  const purpose = fillTemplate(purposeTemplate, {
    serviceLabel: input.serviceLabel,
    serviceKind: SERVICE_KIND[input.source][input.language],
    periodLabel: input.periodLabel,
    periodSuffix: PERIOD_SUFFIX[input.source][input.language],
  });
  const amountLine = fillTemplate(copy.amountLine, { amount: formatAmdAmount(input.amount) });
  const lines = [copy.greeting, purpose, amountLine];
  if (input.taxStatus === 'TAX_FREE') {
    lines.push(buildTaxFreePayBlock(input.language));
  } else {
    lines.push(copy.taxPayByInvoice);
  }
  lines.push(copy.writeIfProblem);
  lines.push(copy.closing);
  return lines.join('\n');
}

function fillTemplate(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, value),
    template,
  );
}

function buildTaxFreePayBlock(language: SubscriptionReminderLanguage): string {
  const header = COPY[language].taxFreePayBlockHeader;
  return [
    header,
    `💳 ${TAX_FREE_PAYMENT_CARD}`,
    `🏦 ${TAX_FREE_PAYMENT_ACCOUNT}`,
    `👤 ${TAX_FREE_PAYMENT_NAME}`,
  ].join('\n');
}
