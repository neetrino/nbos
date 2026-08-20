const APP_FALLBACK_URL = 'http://localhost:3000';

export function escapeReportEmailHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildReportExportEmailSubject(reportTitle: string, format: string): string {
  return `${reportTitle} — ${format} report is ready`;
}

export function buildReportExportEmailHtml(input: {
  reportTitle: string;
  format: string;
  fileName: string;
  generatedAt: Date;
  periodLabel: string;
  filesHref: string;
}): string {
  const title = escapeReportEmailHtml(input.reportTitle);
  const format = escapeReportEmailHtml(input.format);
  const fileName = escapeReportEmailHtml(input.fileName);
  const period = escapeReportEmailHtml(input.periodLabel);
  const generated = escapeReportEmailHtml(
    input.generatedAt.toISOString().replace('T', ' ').slice(0, 16),
  );
  const href = escapeReportEmailHtml(input.filesHref);
  return [
    '<div style="margin:0;padding:24px;background:#f4f4f5;font-family:Inter,Helvetica,Arial,sans-serif;color:#18181b;">',
    '<div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:28px 28px 24px;">',
    '<p style="margin:0 0 4px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#71717a;">NBOS Reports</p>',
    `<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">${title}</h1>`,
    `<p style="margin:0 0 20px;font-size:15px;line-height:1.5;color:#3f3f46;">The ${format} file is attached. Owner and CEO can also download it from Report files.</p>`,
    '<table style="width:100%;border-collapse:collapse;font-size:14px;">',
    row('Format', format),
    row('Period', period),
    row('Generated', `${generated} UTC`),
    row('Attachment', fileName),
    '</table>',
    `<p style="margin:24px 0 0;font-size:14px;"><a href="${href}" style="color:#18181b;font-weight:600;">Open Report files</a></p>`,
    '</div></div>',
  ].join('');
}

export function buildReportFilesHref(appUrl = process.env.APP_URL): string {
  const base = (appUrl ?? APP_FALLBACK_URL).replace(/\/$/, '');
  return `${base}/reports/center/exports`;
}

function row(label: string, value: string): string {
  return [
    '<tr>',
    `<td style="padding:8px 0;color:#71717a;width:120px;vertical-align:top;">${label}</td>`,
    `<td style="padding:8px 0;font-weight:500;">${value}</td>`,
    '</tr>',
  ].join('');
}
