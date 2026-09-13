import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { interpolateSystemCopy, reportExportFileCopy } from '@nbos/shared';
import { resolveReportExportFontPath } from './reports-export-font';
import type { ReportExportFormat } from './reports.types';

export interface ReportExportFile {
  content: Uint8Array;
  contentType: string;
  extension: 'csv' | 'xlsx' | 'pdf';
  fileType: 'SPREADSHEET' | 'DOCUMENT';
}

export async function renderReportExportFile(
  format: ReportExportFormat,
  payload: unknown,
  locale?: unknown,
): Promise<ReportExportFile> {
  const copy = reportExportFileCopy(locale);
  if (format === 'CSV') {
    return {
      content: Buffer.from(toCsvRows(payload, copy), 'utf8'),
      contentType: 'text/csv; charset=utf-8',
      extension: 'csv',
      fileType: 'SPREADSHEET',
    };
  }
  if (format === 'XLSX') {
    return {
      content: await renderXlsx(payload, copy),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
      fileType: 'SPREADSHEET',
    };
  }
  return {
    content: await renderPdf(payload, copy),
    contentType: 'application/pdf',
    extension: 'pdf',
    fileType: 'DOCUMENT',
  };
}

async function renderXlsx(
  payload: unknown,
  copy: ReturnType<typeof reportExportFileCopy>,
): Promise<Uint8Array> {
  const rows = [[copy.path, copy.value], ...flattenPayload(payload)];
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(copy.sheetName);
  rows.forEach((row, rowIndex) => {
    worksheet.getRow(rowIndex + 1).values = row;
  });
  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer);
}

async function renderPdf(
  payload: unknown,
  copy: ReturnType<typeof reportExportFileCopy>,
): Promise<Uint8Array> {
  const rows = flattenPayload(payload);
  const fontPath = resolveReportExportFontPath();
  const generated = interpolateSystemCopy(copy.generatedAt, { iso: new Date().toISOString() });
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const document = new PDFDocument({ size: 'A4', margin: 40 });
    document.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    document.font(fontPath);
    document.fontSize(16).text(copy.title, { underline: true });
    document.moveDown(0.6);
    document.fontSize(10).text(generated);
    document.moveDown(1);
    document.fontSize(9);
    for (const [path, value] of rows) {
      document.text(`${path}: ${value}`);
    }
    document.end();
  });
}

function toCsvRows(payload: unknown, copy: ReturnType<typeof reportExportFileCopy>): string {
  const rows = [[copy.path, copy.value], ...flattenPayload(payload)];
  return rows.map((row) => row.map(escapeCsvCell).join(',')).join('\n') + '\n';
}

function flattenPayload(value: unknown, path = 'report'): string[][] {
  if (value === null || typeof value !== 'object') return [[path, scalarValue(value)]];
  if (Array.isArray(value)) return [[path, JSON.stringify(value)]];
  return Object.entries(value).flatMap(([key, item]) => flattenPayload(item, `${path}.${key}`));
}

function scalarValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

function escapeCsvCell(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}
