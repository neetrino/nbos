import { DESK_LINE_NEUTRAL_FALLBACK } from './desk-line/desk-line.constants';
import { resolveDeskLineDetails } from './desk-line/desk-line-resolve';
import type { DeskLinePerson, DeskLineResolution } from './desk-line/desk-line.types';

export const DASHBOARD_DESK_FALLBACK_GREETING = DESK_LINE_NEUTRAL_FALLBACK.title;
export const DASHBOARD_DESK_FALLBACK_SUBLINE = DESK_LINE_NEUTRAL_FALLBACK.subline;

export function deskCopy(person: DeskLinePerson | null, now?: Date): DeskLineResolution {
  if (!person?.employeeId.trim()) return DESK_LINE_NEUTRAL_FALLBACK;
  return resolveDeskLineDetails(person, now);
}

export function deskHeading(person: DeskLinePerson | null, now?: Date): string {
  return deskCopy(person, now).title;
}

export function deskSubline(person: DeskLinePerson | null, now?: Date): string {
  return deskCopy(person, now).subline;
}
