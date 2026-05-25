import type {
  CalendarLocationType,
  CalendarMeetingStatus,
  CalendarMeetingType,
  PersonalCalendarEventStatus,
} from '@nbos/database';

export type CalendarLayer = 'ALL' | 'MEETINGS' | 'DELIVERY_DEADLINES' | 'PERSONAL';

export interface CalendarRangeQuery {
  from?: string;
  to?: string;
  layer?: CalendarLayer;
}

export interface CalendarEventProjection {
  id: string;
  layer: Exclude<CalendarLayer, 'ALL'>;
  title: string;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  description: string | null;
  status: string;
  sourceType: 'MEETING' | 'PRODUCT_DEADLINE' | 'EXTENSION_DEADLINE' | 'PERSONAL_EVENT';
  sourceId: string;
  sourceHref: string | null;
  badge: string;
  projectName: string | null;
  ownerName: string | null;
}

export interface CreateCalendarMeetingDto {
  title?: string;
  startsAt?: string;
  endsAt?: string;
  meetingType?: CalendarMeetingType;
  locationType?: CalendarLocationType;
  locationOrLink?: string | null;
  agenda?: string | null;
  outcomeNotes?: string | null;
  status?: CalendarMeetingStatus;
  internalParticipantIds?: string[];
  externalParticipants?: unknown;
  projectId?: string | null;
  productId?: string | null;
  dealId?: string | null;
  contactId?: string | null;
  /** Required when overlap checks find conflicts; stored in audit. */
  conflictOverrideReason?: string | null;
}

export type UpdateCalendarMeetingDto = Partial<CreateCalendarMeetingDto>;

export interface CreatePersonalCalendarEventDto {
  title?: string;
  startsAt?: string;
  endsAt?: string;
  isAllDay?: boolean;
  notes?: string | null;
  status?: PersonalCalendarEventStatus;
}

export type UpdatePersonalCalendarEventDto = Partial<CreatePersonalCalendarEventDto>;
