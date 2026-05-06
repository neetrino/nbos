import PDFDocument from 'pdfkit';
import { utils as xlsxUtils, write as writeXlsx } from 'xlsx';
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
): Promise<ReportExportFile> {
  if (format === 'CSV') {
    return {
      content: Buffer.from(toCsvRows(payload), 'utf8'),
      contentType: 'text/csv; charset=utf-8',
      extension: 'csv',
      fileType: 'SPREADSHEET',
    };
  }
  if (format === 'XLSX') {
    return {
      content: renderXlsx(payload),
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
      fileType: 'SPREADSHEET',
    };
  }
  return {
    content: await renderPdf(payload),
    contentType: 'application/pdf',
    extension: 'pdf',
    fileType: 'DOCUMENT',
  };
}

function renderXlsx(payload: unknown): Uint8Array {
  const rows = [['path', 'value'], ...flattenPayload(payload)];
  const workbook = xlsxUtils.book_new();
  const worksheet = xlsxUtils.aoa_to_sheet(rows);
  xlsxUtils.book_append_sheet(workbook, worksheet, 'Report');
  return writeXlsx(workbook, { type: 'buffer', bookType: 'xlsx' });
}

async function renderPdf(payload: unknown): Promise<Uint8Array> {
  const rows = flattenPayload(payload);
  return new Promise((resolve, reject) => {
    const chunks: Uint8Array[] = [];
    const document = new PDFDocument({ size: 'A4', margin: 40 });
    document.on('data', (chunk: Uint8Array) => chunks.push(chunk));
    document.on('end', () => resolve(Buffer.concat(chunks)));
    document.on('error', reject);

    document.fontSize(16).text('Report Export', { underline: true });
    document.moveDown(0.6);
    document.fontSize(10).text(`Generated at: ${new Date().toISOString()}`);
    document.moveDown(1);
    document.fontSize(9);
    for (const [path, value] of rows) {
      document.text(`${path}: ${value}`);
    }
    document.end();
  });
}

function toCsvRows(payload: unknown): string {
  const rows = [['path', 'value'], ...flattenPayload(payload)];
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
