/** Escape a single CSV field (RFC-style). */
export function escapeCsvCell(raw: string): string {
  const value = raw.replace(/\r\n/g, '\n');
  if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function rowsToCsvString(rows: string[][]): string {
  const lines = rows.map((row) => row.map(escapeCsvCell).join(','));
  return `\uFEFF${lines.join('\n')}`;
}

export function downloadCsvString(filename: string, csvBody: string): void {
  const blob = new Blob([csvBody], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
