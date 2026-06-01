import { describe, it, expect } from 'vitest';
import {
  assertUploadFileNameAllowed,
  assertUploadSizeWithinLimit,
  MAX_UPLOAD_BYTES,
} from './drive-upload-validation';

describe('assertUploadFileNameAllowed', () => {
  it('allows normal business files', () => {
    for (const name of ['report.pdf', 'photo.PNG', 'sheet.xlsx', 'archive.zip', 'notes.txt']) {
      expect(() => assertUploadFileNameAllowed(name)).not.toThrow();
    }
  });

  it('allows files without an extension', () => {
    expect(() => assertUploadFileNameAllowed('README')).not.toThrow();
  });

  it('blocks executable / scriptable extensions (case-insensitive)', () => {
    for (const name of ['malware.exe', 'setup.MSI', 'run.sh', 'evil.js', 'page.html', 'logo.svg']) {
      expect(() => assertUploadFileNameAllowed(name)).toThrow(/not allowed/);
    }
  });

  it('uses the last extension', () => {
    expect(() => assertUploadFileNameAllowed('invoice.pdf.exe')).toThrow(/not allowed/);
  });
});

describe('assertUploadSizeWithinLimit', () => {
  it('allows sizes within the cap', () => {
    expect(() => assertUploadSizeWithinLimit(MAX_UPLOAD_BYTES)).not.toThrow();
    expect(() => assertUploadSizeWithinLimit(1024)).not.toThrow();
  });

  it('ignores missing/invalid sizes', () => {
    expect(() => assertUploadSizeWithinLimit(undefined)).not.toThrow();
    expect(() => assertUploadSizeWithinLimit(null)).not.toThrow();
    expect(() => assertUploadSizeWithinLimit(Number.NaN)).not.toThrow();
  });

  it('rejects oversized files', () => {
    expect(() => assertUploadSizeWithinLimit(MAX_UPLOAD_BYTES + 1)).toThrow(/maximum allowed size/);
  });
});
