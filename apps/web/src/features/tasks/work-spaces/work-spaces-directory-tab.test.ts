import { describe, expect, it } from 'vitest';
import {
  parseWorkSpaceDirectoryTab,
  workSpacesDirectoryHeaderContent,
  workSpacesDirectoryHref,
  workSpacesDirectorySearch,
} from './work-spaces-directory-tab';

describe('work spaces directory tab', () => {
  it('treats a missing or unknown query as standalone', () => {
    expect(parseWorkSpaceDirectoryTab(null)).toBe('standalone');
    expect(parseWorkSpaceDirectoryTab('kanban')).toBe('standalone');
    expect(parseWorkSpaceDirectoryTab('product')).toBe('product');
  });

  it('builds shareable directory hrefs', () => {
    expect(workSpacesDirectoryHref('standalone')).toBe('/work-spaces');
    expect(workSpacesDirectoryHref('product')).toBe('/work-spaces?wsTab=product');
  });

  it('writes the tab into the current search string', () => {
    expect(workSpacesDirectorySearch('product', '')).toBe('wsTab=product');
    expect(workSpacesDirectorySearch('standalone', 'wsTab=product')).toBe('');
  });

  it('marks the active header pill from the current tab', () => {
    const content = workSpacesDirectoryHeaderContent('product');
    expect(content.kind).toBe('nav');
    if (content.kind !== 'nav') return;
    expect(content.fullWidthOnMobile).toBe(true);
    expect(content.items.map((item) => item.label)).toEqual(['Standalone', 'Product']);
    expect(content.items[0]?.isActive?.('/work-spaces')).toBe(false);
    expect(content.items[1]?.isActive?.('/work-spaces')).toBe(true);
  });
});
