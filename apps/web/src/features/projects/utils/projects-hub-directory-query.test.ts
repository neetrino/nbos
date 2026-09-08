import { describe, expect, it } from 'vitest';
import { projectsHubTabToListParams } from './projects-hub-directory-query';

describe('projectsHubTabToListParams', () => {
  it('sends hubView for operational tabs and trash scope for Trash', () => {
    expect(projectsHubTabToListParams('all')).toEqual({});
    expect(projectsHubTabToListParams('incoming')).toEqual({ hubView: 'incoming' });
    expect(projectsHubTabToListParams('active')).toEqual({ hubView: 'active' });
    expect(projectsHubTabToListParams('closed')).toEqual({ hubView: 'closed' });
    expect(projectsHubTabToListParams('trash')).toEqual({ scope: 'trash' });
  });
});
