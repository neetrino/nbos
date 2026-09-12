import { DESK_LINE_ONBOARDING_DAYS } from './desk-line.constants';
import {
  calendarDaysBetween,
  monthDayMatches,
  parseValidCalendarDate,
  type CalendarDateParts,
} from './desk-line-calendar';
import type { DeskLineCalendarDay, DeskLinePerson, DeskLinePoolId } from './desk-line.types';

export type PersonalOccasion =
  | { pool: 'birthday'; years?: undefined }
  | { pool: 'first_day'; years?: undefined }
  | { pool: 'anniversary_one'; years: 1 }
  | { pool: 'anniversary_many'; years: number }
  | { pool: 'onboarding_3'; years?: undefined }
  | { pool: 'onboarding_10'; years?: undefined }
  | { pool: 'onboarding_21'; years?: undefined };

export function detectPersonalOccasion(
  person: DeskLinePerson,
  today: DeskLineCalendarDay,
): PersonalOccasion | null {
  const birthday = parseValidCalendarDate(person.birthday);
  if (birthday && monthDayMatches(birthday, today)) return { pool: 'birthday' };

  const hire = parseValidCalendarDate(person.hireDate);
  if (!hire) return null;
  return occasionFromHire(hire, today);
}

function occasionFromHire(
  hire: CalendarDateParts,
  today: DeskLineCalendarDay,
): PersonalOccasion | null {
  const days = calendarDaysBetween(hire, today);
  if (days < 0) return null;
  if (days === 0) return { pool: 'first_day' };
  if (monthDayMatches(hire, today) && today.year > hire.year) {
    const years = today.year - hire.year;
    return years === 1
      ? { pool: 'anniversary_one', years: 1 }
      : { pool: 'anniversary_many', years };
  }
  return onboardingOccasion(days);
}

function onboardingOccasion(days: number): PersonalOccasion | null {
  if (days === DESK_LINE_ONBOARDING_DAYS[0]) return { pool: 'onboarding_3' };
  if (days === DESK_LINE_ONBOARDING_DAYS[1]) return { pool: 'onboarding_10' };
  if (days === DESK_LINE_ONBOARDING_DAYS[2]) return { pool: 'onboarding_21' };
  return null;
}

export function memorialPersonalPool(pool: DeskLinePoolId): DeskLinePoolId {
  if (pool === 'birthday') return 'birthday_memorial';
  if (pool === 'first_day') return 'first_day_memorial';
  if (pool === 'anniversary_one' || pool === 'anniversary_many') {
    return 'anniversary_memorial';
  }
  if (pool === 'onboarding_3' || pool === 'onboarding_10' || pool === 'onboarding_21') {
    return 'memorial_neutral';
  }
  return pool;
}
