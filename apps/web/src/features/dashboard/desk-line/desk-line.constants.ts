import type { DeskLineResolution } from './desk-line.types';

export const DESK_LINE_TIMEZONE = 'Asia/Yerevan';
export const DESK_LINE_CATALOG_VERSION = 'desk-line-v1';
export const DESK_LINE_EPOCH_YEAR = 2020;
export const DESK_LINE_EPOCH_MONTH = 1;
export const DESK_LINE_EPOCH_DAY = 1;
export const DESK_LINE_MS_PER_DAY = 86_400_000;
export const DESK_LINE_YEREVAN_OFFSET_HOURS = 4;

export const DESK_LINE_EVERYDAY_MIN_SIZE = 96;
export const DESK_LINE_SEASON_MIN_SIZE = 16;
export const DESK_LINE_SEASON_SLOT_PERIOD = 4;
export const DESK_LINE_CULTURAL_HALF = 2;
export const DESK_LINE_REPEAT_WINDOW_DAYS = 45;
export const DESK_LINE_ONBOARDING_DAYS = [3, 10, 21] as const;

export const DESK_LINE_LEAP_MONTH = 2;
export const DESK_LINE_LEAP_DAY = 29;
export const DESK_LINE_LEAP_OBSERVED_DAY = 28;

export const DESK_LINE_SPRING_START_MONTH = 3;
export const DESK_LINE_SUMMER_START_MONTH = 6;
export const DESK_LINE_AUTUMN_START_MONTH = 9;
export const DESK_LINE_WINTER_START_MONTH = 12;

export const DESK_LINE_MEMORIAL_MONTH_DAY = '04-24';

export const DESK_LINE_NEUTRAL_FALLBACK: DeskLineResolution = {
  templateId: 'fallback-peaceful',
  theme: 'peaceful',
  title: 'Wishing you a peaceful day.',
  subline: 'A little room for what matters to you.',
  titleTemplate: 'Wishing you a peaceful day.',
  sublineTemplate: 'A little room for what matters to you.',
  slots: { firstName: null },
  icon: 'None',
  pool: 'memorial_neutral',
};
