import { describe, expect, it } from 'vitest';
import {
  departmentRoleForRemainingSeats,
  type OpenSeatProjection,
} from './org-seat-membership.ops';

const HEAD_SEAT_ID = 'seat-head';

function seat(id: string, kind: string): Pick<OpenSeatProjection, 'seat'> {
  return { seat: { id, kind, department: { headSeatId: HEAD_SEAT_ID } } };
}

describe('departmentRoleForRemainingSeats', () => {
  it('reports plain membership when no seat is left', () => {
    expect(departmentRoleForRemainingSeats([])).toBe('MEMBER');
  });

  it('keeps leadership while the head seat is still held', () => {
    expect(departmentRoleForRemainingSeats([seat(HEAD_SEAT_ID, 'HEAD')])).toBe('HEAD');
  });

  it('takes the highest rank when several seats are held at once', () => {
    const remaining = [seat('seat-other', 'STANDARD'), seat(HEAD_SEAT_ID, 'HEAD')];
    expect(departmentRoleForRemainingSeats(remaining)).toBe('HEAD');
  });

  it('falls back to deputy when the head seat is gone but a deputy seat remains', () => {
    const remaining = [seat('seat-deputy', 'DEPUTY'), seat('seat-other', 'STANDARD')];
    expect(departmentRoleForRemainingSeats(remaining)).toBe('DEPUTY');
  });

  it('drops leadership when only a standard seat remains', () => {
    expect(departmentRoleForRemainingSeats([seat('seat-other', 'STANDARD')])).toBe('MEMBER');
  });

  it('ignores the DEPUTY kind on the seat that the department declared as head', () => {
    expect(departmentRoleForRemainingSeats([seat(HEAD_SEAT_ID, 'DEPUTY')])).toBe('HEAD');
  });
});
