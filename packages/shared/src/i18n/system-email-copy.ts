import { parseKnownInterfaceLocale, type KnownInterfaceLocale } from './locales';

export type SystemEmailLocale = KnownInterfaceLocale;

export interface PasswordResetEmailCopy {
  subject: string;
  intro: string;
  action: string;
  expires: string;
  ignore: string;
}

export interface InvitationEmailCopy {
  subject: string;
  intro: string;
  action: string;
  expires: string;
}

export interface ReportExportEmailCopy {
  subject: string;
  kicker: string;
  body: string;
  format: string;
  period: string;
  generated: string;
  attachment: string;
  openFiles: string;
  currentDates: string;
  asOf: string;
}

const PASSWORD_RESET_COPY: Record<SystemEmailLocale, PasswordResetEmailCopy> = {
  en: {
    subject: 'Reset your NBOS password',
    intro: 'We received a request to reset your NBOS password.',
    action: 'Set a new password',
    expires: 'This link expires at {expiresLabel}.',
    ignore: 'If you did not request this, you can ignore this email.',
  },
  ru: {
    subject: 'Сброс пароля NBOS',
    intro: 'Мы получили запрос на сброс пароля NBOS.',
    action: 'Задать новый пароль',
    expires: 'Ссылка действует до {expiresLabel}.',
    ignore: 'Если вы не запрашивали сброс, просто проигнорируйте это письмо.',
  },
  hy: {
    subject: 'NBOS գաղտնաբառի վերականգնում',
    intro: 'Մենք ստացել ենք NBOS գաղտնաբառը վերականգնելու հարցում։',
    action: 'Սահմանել նոր գաղտնաբառ',
    expires: 'Հղումը գործում է մինչև {expiresLabel}։',
    ignore: 'Եթե դուք չեք ուղարկել այս հարցումը, կարող եք անտեսել նամակը։',
  },
};

const INVITATION_COPY: Record<SystemEmailLocale, InvitationEmailCopy> = {
  en: {
    subject: 'You are invited to NBOS',
    intro: 'You have been invited to NBOS.',
    action: 'Accept invitation',
    expires: 'Invitation expires on: {expiresAt}',
  },
  ru: {
    subject: 'Вас пригласили в NBOS',
    intro: 'Вас пригласили в NBOS.',
    action: 'Принять приглашение',
    expires: 'Приглашение действует до: {expiresAt}',
  },
  hy: {
    subject: 'Ձեզ հրավիրել են NBOS',
    intro: 'Ձեզ հրավիրել են NBOS։',
    action: 'Ընդունել հրավերը',
    expires: 'Հրավերը գործում է մինչև՝ {expiresAt}',
  },
};

const REPORT_EXPORT_COPY: Record<SystemEmailLocale, ReportExportEmailCopy> = {
  en: {
    subject: '{title} — {format} report is ready',
    kicker: 'NBOS Reports',
    body: 'The {format} file is attached. Owner and CEO can also download it from Report files.',
    format: 'Format',
    period: 'Period',
    generated: 'Generated',
    attachment: 'Attachment',
    openFiles: 'Open Report files',
    currentDates: 'Current report dates',
    asOf: 'As of {date}',
  },
  ru: {
    subject: '{title} — отчёт {format} готов',
    kicker: 'Отчёты NBOS',
    body: 'Файл {format} во вложении. Владелец и CEO также могут скачать его в «Файлы отчётов».',
    format: 'Формат',
    period: 'Период',
    generated: 'Создано',
    attachment: 'Вложение',
    openFiles: 'Открыть файлы отчётов',
    currentDates: 'Текущие даты отчёта',
    asOf: 'На {date}',
  },
  hy: {
    subject: '{title} — {format} հաշվետվությունը պատրաստ է',
    kicker: 'NBOS հաշվետվություններ',
    body: '{format} ֆայլը կցված է։ Սեփականատերն ու CEO-ն կարող են այն ներբեռնել նաև «Հաշվետվության ֆայլերից»։',
    format: 'Ձևաչափ',
    period: 'Ժամանակահատված',
    generated: 'Ստեղծված',
    attachment: 'Կցորդ',
    openFiles: 'Բացել հաշվետվության ֆայլերը',
    currentDates: 'Ընթացիկ ամսաթվեր',
    asOf: '{date}-ի դրությամբ',
  },
};

export function interpolateSystemCopy(template: string, vars: Record<string, string>): string {
  return template.replace(/\{([a-zA-Z]+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : value;
  });
}

export function passwordResetEmailCopy(locale: unknown): PasswordResetEmailCopy {
  return PASSWORD_RESET_COPY[parseKnownInterfaceLocale(locale)];
}

export function invitationEmailCopy(locale: unknown): InvitationEmailCopy {
  return INVITATION_COPY[parseKnownInterfaceLocale(locale)];
}

export function reportExportEmailCopy(locale: unknown): ReportExportEmailCopy {
  return REPORT_EXPORT_COPY[parseKnownInterfaceLocale(locale)];
}
