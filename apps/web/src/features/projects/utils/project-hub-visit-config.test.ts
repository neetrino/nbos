import { describe, expect, it } from 'vitest';
import {
  isProjectHubDirectoryPath,
  resolveProjectHubSectionId,
} from '@/lib/navigation/module-last-visit/project-hub-visit-config';

describe('project-hub visit routing', () => {
  it('resolves catalog and workspace paths', () => {
    expect(resolveProjectHubSectionId('/projects')).toBe('projects');
    expect(resolveProjectHubSectionId('/projects/abc')).toBe('projects');
    expect(resolveProjectHubSectionId('/projects/products')).toBe('products');
    expect(resolveProjectHubSectionId('/projects/abc/products/xyz')).toBe('products');
  });

  it('treats only catalog URLs as directory chrome', () => {
    expect(isProjectHubDirectoryPath('/projects')).toBe(true);
    expect(isProjectHubDirectoryPath('/projects/products')).toBe(true);
    expect(isProjectHubDirectoryPath('/projects/abc')).toBe(false);
    expect(isProjectHubDirectoryPath('/projects/abc/products/xyz')).toBe(false);
  });
});
