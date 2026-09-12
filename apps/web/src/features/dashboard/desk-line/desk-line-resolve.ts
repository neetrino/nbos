import { DESK_LINE_CATALOG, deskLinePool } from './desk-line-catalog';
import {
  deskLineSeason,
  eventOnMonthDay,
  isMemorialDay,
  yerevanCalendarDay,
} from './desk-line-calendar';
import {
  DESK_LINE_CULTURAL_HALF,
  DESK_LINE_NEUTRAL_FALLBACK,
  DESK_LINE_SEASON_SLOT_PERIOD,
} from './desk-line.constants';
import {
  isSeasonSlot,
  participatesInEvent,
  pickEveryday,
  pickEventVariant,
  pickFromDeck,
  seasonDeckIndex,
  seasonPhase,
} from './desk-line-deck';
import { detectPersonalOccasion, memorialPersonalPool } from './desk-line-personal';
import { fillDeskLineSlots } from './desk-line-slots';
import type {
  DeskLineCalendarDay,
  DeskLinePerson,
  DeskLinePoolId,
  DeskLineResolution,
  DeskLineTemplate,
} from './desk-line.types';

/** Short desk title for this employee on the Yerevan calendar day. */
export function resolveDeskLine(person: DeskLinePerson, now: Date = new Date()): string {
  return resolveDeskLineDetails(person, now).title;
}

export function resolveDeskLineDetails(
  person: DeskLinePerson,
  now: Date = new Date(),
): DeskLineResolution {
  if (!person.employeeId.trim()) return DESK_LINE_NEUTRAL_FALLBACK;
  const today = yerevanCalendarDay(now);
  const template = pickDeskLineTemplate(person, today);
  const firstName = person.firstName?.trim() || null;
  return {
    templateId: template.id,
    theme: template.theme,
    title: fillDeskLineSlots(template.title, { firstName, years: yearsFrom(person, today) }),
    subline: fillDeskLineSlots(template.subline, { firstName, years: yearsFrom(person, today) }),
    icon: template.icon,
    pool: template.pool,
  };
}

export function pickDeskLineTemplate(
  person: DeskLinePerson,
  today: DeskLineCalendarDay,
): DeskLineTemplate {
  const memorial = isMemorialDay(today.monthDay);
  const personal = detectPersonalOccasion(person, today);
  if (personal) {
    const pool = memorial ? memorialPersonalPool(personal.pool) : personal.pool;
    return pickPersonal(person.employeeId, pool, today) ?? memorialOrEveryday(person, today, memorial);
  }
  if (memorial) return pickMemorial(person.employeeId, today);
  const cultural = pickCultural(person.employeeId, today);
  if (cultural) return cultural;
  return pickSeasonOrEveryday(person.employeeId, today);
}

function pickPersonal(
  employeeId: string,
  pool: DeskLinePoolId,
  today: DeskLineCalendarDay,
): DeskLineTemplate | null {
  return pickFromDeck(employeeId, pool, deskLinePool(pool), today.dayOrdinal);
}

function pickCultural(
  employeeId: string,
  today: DeskLineCalendarDay,
): DeskLineTemplate | null {
  const event = eventOnMonthDay(today.monthDay);
  if (!event) return null;
  if (!participatesInEvent(employeeId, today.dateKey, event.id, DESK_LINE_CULTURAL_HALF)) {
    return null;
  }
  return pickEventVariant(employeeId, today.dateKey, event.id, deskLinePool('cultural', event.id));
}

function pickSeasonOrEveryday(employeeId: string, today: DeskLineCalendarDay): DeskLineTemplate {
  const phase = seasonPhase(employeeId);
  if (isSeasonSlot(today.dayOrdinal, phase, DESK_LINE_SEASON_SLOT_PERIOD)) {
    const pool = seasonPool(today.month);
    const index = seasonDeckIndex(
      employeeId,
      pool,
      today.dayOrdinal,
      phase,
      DESK_LINE_SEASON_SLOT_PERIOD,
    );
    const seasonal = pickFromDeck(employeeId, pool, deskLinePool(pool), index);
    if (seasonal) return seasonal;
  }
  return (
    pickEveryday(employeeId, today.dayOrdinal, deskLinePool('everyday')) ??
    DESK_LINE_CATALOG[0]!
  );
}

function pickMemorial(employeeId: string, today: DeskLineCalendarDay): DeskLineTemplate {
  return (
    pickFromDeck(employeeId, 'memorial_neutral', deskLinePool('memorial_neutral'), today.dayOrdinal) ??
    DESK_LINE_CATALOG.find((line) => line.id === 'memorial-plain') ??
    DESK_LINE_CATALOG[0]!
  );
}

function memorialOrEveryday(
  person: DeskLinePerson,
  today: DeskLineCalendarDay,
  memorial: boolean,
): DeskLineTemplate {
  if (memorial) return pickMemorial(person.employeeId, today);
  return pickSeasonOrEveryday(person.employeeId, today);
}

function seasonPool(month: number): DeskLinePoolId {
  return `season_${deskLineSeason(month)}`;
}

function yearsFrom(person: DeskLinePerson, today: DeskLineCalendarDay): number | undefined {
  const personal = detectPersonalOccasion(person, today);
  return personal && 'years' in personal ? personal.years : undefined;
}
