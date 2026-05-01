import { describe, expect, it } from 'vitest';
import { FINANCE_DOCUMENT_TITLE_SUFFIX, buildFinanceDocumentTitle } from './finance-document-title';

describe('finance document title', () => {
  it('appends the canonical Finance suffix', () => {
    expect(buildFinanceDocumentTitle('Invoices')).toBe(`Invoices${FINANCE_DOCUMENT_TITLE_SUFFIX}`);
  });

  it('keeps arbitrary page labels verbatim before the suffix', () => {
    expect(buildFinanceDocumentTitle('Expense backlog')).toBe(
      `Expense backlog${FINANCE_DOCUMENT_TITLE_SUFFIX}`,
    );
  });
});
