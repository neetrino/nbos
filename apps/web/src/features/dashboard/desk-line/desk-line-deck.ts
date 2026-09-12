import {
  catalogSeed,
  compareByPersonalOrder,
  positiveModulo,
  unsignedHash,
} from './desk-line-hash';
import type { DeskLinePoolId, DeskLineTemplate } from './desk-line.types';

export function orderDeck(
  employeeId: string,
  poolId: DeskLinePoolId,
  templates: readonly DeskLineTemplate[],
): DeskLineTemplate[] {
  return [...templates].sort((left, right) =>
    compareByPersonalOrder(employeeId, poolId, left.id, right.id),
  );
}

export function personalOffset(employeeId: string, poolId: DeskLinePoolId): number {
  return unsignedHash(catalogSeed(employeeId, poolId, 'offset'));
}

export function pickFromDeck(
  employeeId: string,
  poolId: DeskLinePoolId,
  templates: readonly DeskLineTemplate[],
  index: number,
): DeskLineTemplate | null {
  if (templates.length === 0) return null;
  const ordered = orderDeck(employeeId, poolId, templates);
  return ordered[positiveModulo(index, ordered.length)] ?? null;
}

export function pickEveryday(
  employeeId: string,
  dayOrdinal: number,
  templates: readonly DeskLineTemplate[],
): DeskLineTemplate | null {
  const offset = personalOffset(employeeId, 'everyday');
  return pickFromDeck(employeeId, 'everyday', templates, dayOrdinal + offset);
}

export function seasonPhase(employeeId: string): number {
  return unsignedHash(catalogSeed(employeeId, 'season-phase')) % 4;
}

export function isSeasonSlot(dayOrdinal: number, phase: number, period: number): boolean {
  return positiveModulo(dayOrdinal + phase, period) === 0;
}

export function seasonDeckIndex(
  employeeId: string,
  poolId: DeskLinePoolId,
  dayOrdinal: number,
  phase: number,
  period: number,
): number {
  const offset = personalOffset(employeeId, poolId);
  return Math.floor((dayOrdinal + phase) / period) + offset;
}

export function participatesInEvent(
  employeeId: string,
  dateKey: string,
  eventId: string,
  half: number,
): boolean {
  return unsignedHash(`${employeeId}|${dateKey}|${eventId}`) % half === 0;
}

export function pickEventVariant(
  employeeId: string,
  dateKey: string,
  eventId: string,
  templates: readonly DeskLineTemplate[],
): DeskLineTemplate | null {
  if (templates.length === 0) return null;
  const ordered = orderDeck(employeeId, 'cultural', templates);
  const index = unsignedHash(`${employeeId}|${dateKey}|${eventId}|variant`);
  return ordered[positiveModulo(index, ordered.length)] ?? null;
}
