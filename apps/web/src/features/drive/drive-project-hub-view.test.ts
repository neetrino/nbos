import { describe, expect, it } from 'vitest';
import {
  productHubExtensions,
  resolveProjectHubFileListParams,
  resolveProjectHubFocusLabel,
} from './drive-project-hub-view';
import type { ProjectDriveHubSummary } from './drive-project-hub-view';

const summary: ProjectDriveHubSummary = {
  projectId: 'proj-1',
  projectCode: 'P1',
  projectName: 'Site',
  deals: [],
  products: [
    {
      id: 'prod-1',
      label: 'Website',
      fileCount: 2,
      extensions: [{ id: 'ext-1', label: 'Phase 2', fileCount: 1 }],
    },
  ],
  client: [
    { id: 'co-1', entityType: 'COMPANY', label: 'Acme', fileCount: 3 },
    { id: 'ct-1', entityType: 'CONTACT', label: 'Jane', fileCount: 1 },
  ],
  tasks: [],
  invoices: [],
};

describe('resolveProjectHubFileListParams', () => {
  it('maps client focus to COMPANY entity type', () => {
    const params = resolveProjectHubFileListParams(
      'proj-1',
      { section: 'client', focusEntityId: 'co-1' },
      {},
      summary,
    );
    expect(params).toEqual({ entityType: 'COMPANY', entityId: 'co-1' });
  });

  it('maps product extension focus to EXTENSION', () => {
    const params = resolveProjectHubFileListParams(
      'proj-1',
      { section: 'products', focusEntityId: 'prod-1', focusExtensionId: 'ext-1' },
      {},
      summary,
    );
    expect(params).toEqual({ entityType: 'EXTENSION', entityId: 'ext-1' });
  });
});

describe('resolveProjectHubFocusLabel', () => {
  it('combines product and extension labels', () => {
    const label = resolveProjectHubFocusLabel(summary, {
      section: 'products',
      focusEntityId: 'prod-1',
      focusExtensionId: 'ext-1',
    });
    expect(label).toBe('Website · Phase 2');
  });
});

describe('productHubExtensions', () => {
  it('returns extensions for selected product', () => {
    expect(productHubExtensions(summary, 'prod-1')).toHaveLength(1);
    expect(productHubExtensions(summary, 'missing')).toHaveLength(0);
  });
});
