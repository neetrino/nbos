export const DESK_LINE_ICON_KEYS = [
  'None',
  'Sparkles',
  'Smile',
  'Coffee',
  'MessageCircle',
  'Lightbulb',
  'Compass',
  'Music',
  'Sun',
  'Sunset',
  'Leaf',
  'BookOpen',
  'Sprout',
  'Cake',
  'PartyPopper',
  'Hand',
] as const;

export type DeskLineIconKey = (typeof DESK_LINE_ICON_KEYS)[number];

export const DESK_LINE_POOLS = [
  'everyday',
  'season_spring',
  'season_summer',
  'season_autumn',
  'season_winter',
  'birthday',
  'birthday_memorial',
  'first_day',
  'first_day_memorial',
  'anniversary_one',
  'anniversary_many',
  'anniversary_memorial',
  'onboarding_3',
  'onboarding_10',
  'onboarding_21',
  'cultural',
  'memorial_neutral',
] as const;

export type DeskLinePoolId = (typeof DESK_LINE_POOLS)[number];

export const DESK_LINE_SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;
export type DeskLineSeason = (typeof DESK_LINE_SEASONS)[number];

export type DeskLineEventKind = 'cultural' | 'celebration' | 'memorial';
export type DeskLineTone = 'warm' | 'neutral' | 'memorial' | 'festive';

export interface DeskLinePerson {
  employeeId: string;
  firstName?: string | null;
  birthday?: string | null;
  hireDate?: string | null;
  status?: string | null;
}

export interface DeskLineCalendarDay {
  year: number;
  month: number;
  day: number;
  monthDay: string;
  dateKey: string;
  dayOrdinal: number;
}

export interface DeskLineCalendarEvent {
  id: string;
  monthDay: string;
  kind: DeskLineEventKind;
  /** Official source used to include this date. */
  source: string;
}

export interface DeskLineTemplate {
  id: string;
  pool: DeskLinePoolId;
  theme: string;
  icon: DeskLineIconKey;
  title: string;
  subline: string;
  tone: DeskLineTone;
  eventId?: string;
}

export interface DeskLineSlots {
  firstName: string | null;
  years?: number;
}

export interface DeskLineResolution {
  templateId: string;
  theme: string;
  title: string;
  subline: string;
  icon: DeskLineIconKey;
  pool: DeskLinePoolId;
}
