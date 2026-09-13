import { parseKnownInterfaceLocale, type KnownInterfaceLocale } from './locales';

export interface ReportExportFileCopy {
  title: string;
  generatedAt: string;
  path: string;
  value: string;
  sheetName: string;
}

const REPORT_EXPORT_FILE_COPY: Record<KnownInterfaceLocale, ReportExportFileCopy> = {
  en: {
    title: 'Report Export',
    generatedAt: 'Generated at: {iso}',
    path: 'path',
    value: 'value',
    sheetName: 'Report',
  },
  ru: {
    title: 'Экспорт отчёта',
    generatedAt: 'Создано: {iso}',
    path: 'путь',
    value: 'значение',
    sheetName: 'Отчёт',
  },
  hy: {
    title: 'Հաշվետվության արտահանում',
    generatedAt: 'Ստեղծված՝ {iso}',
    path: 'ուղի',
    value: 'արժեք',
    sheetName: 'Հաշվետվություն',
  },
};

export function reportExportFileCopy(locale: unknown): ReportExportFileCopy {
  return REPORT_EXPORT_FILE_COPY[parseKnownInterfaceLocale(locale)];
}
