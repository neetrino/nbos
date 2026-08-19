import { describe, expect, it } from 'vitest';
import { personNameFromLead } from './lead-person-name.ops';

describe('personNameFromLead', () => {
  it('splits contactName into first and last', () => {
    expect(personNameFromLead({ contactName: 'Karen Sargsyan', name: 'App' })).toEqual({
      firstName: 'Karen',
      lastName: 'Sargsyan',
    });
  });

  it('falls back to inquiry title then Contact', () => {
    expect(personNameFromLead({ contactName: '  ', name: 'Site inquiry' })).toEqual({
      firstName: 'Site',
      lastName: 'inquiry',
    });
    expect(personNameFromLead({ contactName: '', name: null })).toEqual({
      firstName: 'Contact',
      lastName: '',
    });
  });
});
