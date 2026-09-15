import { describe, expect, it } from 'vitest';
import { seatKindOptions, type SeatKindOptionInput } from './org-seat-kind-options';

const SALES = 'dept-sales';
const MARKETING = 'dept-marketing';

function seat(
  id: string,
  departmentId: string,
  kind: SeatKindOptionInput['kind'],
): SeatKindOptionInput {
  return { id, departmentId, kind };
}

describe('seatKindOptions', () => {
  it('offers every kind when the department has no head', () => {
    const seats = [seat('seller-1', SALES, 'STANDARD')];
    expect(seatKindOptions(seats, SALES)).toEqual({
      kinds: ['HEAD', 'DEPUTY', 'STANDARD'],
      headTaken: false,
    });
  });

  it('hides HEAD when another seat is already the head', () => {
    const seats = [seat('head-1', SALES, 'HEAD'), seat('seller-1', SALES, 'STANDARD')];
    expect(seatKindOptions(seats, SALES)).toEqual({
      kinds: ['DEPUTY', 'STANDARD'],
      headTaken: true,
    });
  });

  it('keeps HEAD when the seat being edited is the department head', () => {
    const seats = [seat('head-1', SALES, 'HEAD')];
    expect(seatKindOptions(seats, SALES, 'head-1')).toEqual({
      kinds: ['HEAD', 'DEPUTY', 'STANDARD'],
      headTaken: false,
    });
  });

  it('ignores a head seat that belongs to another department', () => {
    const seats = [seat('head-mkt', MARKETING, 'HEAD')];
    expect(seatKindOptions(seats, SALES)).toEqual({
      kinds: ['HEAD', 'DEPUTY', 'STANDARD'],
      headTaken: false,
    });
  });
});
