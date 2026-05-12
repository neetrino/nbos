import { describe, it, expect } from 'vitest';
import {
  normalizeChecklistTemplateItems,
  validateChecklistTemplateEvidenceFields,
} from './checklist-template-items';

describe('checklist-template-items', () => {
  it('rejects URL type without value', () => {
    const [row] = normalizeChecklistTemplateItems([
      {
        title: 'A',
        instruction: '',
        decisionRequired: false,
        sortOrder: 0,
        evidenceType: 'URL',
        evidenceValue: '  ',
      },
    ]);
    expect(validateChecklistTemplateEvidenceFields(row!, 0)).toMatch(/add a link/);
  });

  it('accepts TEXT_ONLY without evidence fields', () => {
    const [row] = normalizeChecklistTemplateItems([
      {
        title: 'A',
        instruction: 'x',
        decisionRequired: false,
        sortOrder: 0,
      },
    ]);
    expect(validateChecklistTemplateEvidenceFields(row!, 0)).toBeUndefined();
  });
});
