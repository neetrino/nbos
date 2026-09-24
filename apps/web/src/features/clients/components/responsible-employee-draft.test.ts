import { describe, expect, it } from 'vitest';
import {
  createResponsibleEmployeeDraft,
  responsibleEmployeePatch,
} from './responsible-employee-draft';

describe('createResponsibleEmployeeDraft', () => {
  it('uses the related employee when present', () => {
    expect(
      createResponsibleEmployeeDraft(
        { id: 'emp-1', firstName: 'Anna', lastName: 'Sargsyan', avatar: 'a.png' },
        'ignored',
      ),
    ).toEqual({
      responsibleEmployeeId: 'emp-1',
      responsibleDisplayLabel: 'Anna Sargsyan',
      responsibleAvatar: 'a.png',
    });
  });
});

describe('responsibleEmployeePatch', () => {
  const snap = createResponsibleEmployeeDraft({ id: 'emp-1', firstName: 'A', lastName: 'B' });

  it('omits an unchanged owner', () => {
    expect(responsibleEmployeePatch(snap, snap)).toEqual({});
  });

  it('clears an emptied owner', () => {
    expect(
      responsibleEmployeePatch(snap, {
        responsibleEmployeeId: '',
        responsibleDisplayLabel: '',
        responsibleAvatar: null,
      }),
    ).toEqual({ responsibleEmployeeId: null });
  });
});
