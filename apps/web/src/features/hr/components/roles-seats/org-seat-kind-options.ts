import type { OrgSeat, OrgSeatKind } from '@/lib/api/org-seats';

export const ORG_SEAT_KINDS: readonly OrgSeatKind[] = ['HEAD', 'DEPUTY', 'STANDARD'];

export type SeatKindOptionInput = Pick<OrgSeat, 'id' | 'departmentId' | 'kind'>;

export type SeatKindOptions = {
  kinds: readonly OrgSeatKind[];
  headTaken: boolean;
};

/**
 * Allowed org-chart kinds for a seat. A department has at most one HEAD seat;
 * the seat that already is the head keeps HEAD when it is being edited.
 */
export function seatKindOptions(
  seats: readonly SeatKindOptionInput[],
  departmentId: string,
  editingSeatId?: string,
): SeatKindOptions {
  const otherHead = seats.some(
    (seat) =>
      seat.departmentId === departmentId && seat.kind === 'HEAD' && seat.id !== editingSeatId,
  );
  if (!otherHead) return { kinds: ORG_SEAT_KINDS, headTaken: false };
  return { kinds: ORG_SEAT_KINDS.filter((kind) => kind !== 'HEAD'), headTaken: true };
}

export function isOrgSeatKind(value: string): value is OrgSeatKind {
  return (ORG_SEAT_KINDS as readonly string[]).includes(value);
}
