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
    expect(validateChecklistTemplateEvidenceFields(row!, 0)).toMatch(/add evidence/);
  });

  it('accepts FILE_LINK with UUID-shaped file asset id', () => {
    const [row] = normalizeChecklistTemplateItems([
      {
        title: 'A',
        instruction: '',
        decisionRequired: false,
        sortOrder: 0,
        evidenceType: 'FILE_LINK',
        evidenceValue: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      },
    ]);
    expect(validateChecklistTemplateEvidenceFields(row!, 0)).toBeUndefined();
  });

  it('rejects FILE_LINK with arbitrary non-URL text', () => {
    const [row] = normalizeChecklistTemplateItems([
      {
        title: 'A',
        instruction: '',
        decisionRequired: false,
        sortOrder: 0,
        evidenceType: 'FILE_LINK',
        evidenceValue: 'not-a-url',
      },
    ]);
    expect(validateChecklistTemplateEvidenceFields(row!, 0)).toMatch(/uploaded file/);
  });

  it('accepts FILE_LINK with JSON array of two file asset ids', () => {
    const [row] = normalizeChecklistTemplateItems([
      {
        title: 'A',
        instruction: '',
        decisionRequired: false,
        sortOrder: 0,
        evidenceType: 'FILE_LINK',
        evidenceValue:
          '["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11","b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22"]',
      },
    ]);
    expect(validateChecklistTemplateEvidenceFields(row!, 0)).toBeUndefined();
  });

  it('rejects FILE_LINK JSON array exceeding max files', () => {
    const uuids = [
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a04',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a05',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a06',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a07',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a08',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a09',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a0a',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a0b',
    ];
    const [row] = normalizeChecklistTemplateItems([
      {
        title: 'A',
        instruction: '',
        decisionRequired: false,
        sortOrder: 0,
        evidenceType: 'FILE_LINK',
        evidenceValue: JSON.stringify(uuids),
      },
    ]);
    expect(validateChecklistTemplateEvidenceFields(row!, 0)).toMatch(/uploaded file/);
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
