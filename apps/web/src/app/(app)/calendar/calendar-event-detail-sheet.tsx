'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  calendarApi,
  type CalendarEventProjection,
  type CalendarMeetingDetail,
  type CalendarPersonalEventDetail,
} from '@/lib/api/calendar';
import { getApiErrorMessage } from '@/lib/api-errors';
import { CRM_OPEN_DEAL_QUERY } from '@/features/crm/constants/crm-list-sheet-url';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CLIENT_CONTACT_OPEN_QUERY } from './calendar-ui-constants';

export interface CalendarEventDetailSheetProps {
  event: CalendarEventProjection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatEnumLabel(value: string): string {
  return value.replaceAll('_', ' ');
}

function formatRange(startIso: string, endIso: string, isAllDay: boolean): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (isAllDay) {
    return `${start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} — All day`;
  }
  return `${start.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} — ${end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
}

function MeetingDetailLinks({ m }: { m: CalendarMeetingDetail }) {
  const links: Array<{ href: string; label: string }> = [];
  if (m.dealId) {
    links.push({
      href: `/crm/deals?${CRM_OPEN_DEAL_QUERY}=${encodeURIComponent(m.dealId)}`,
      label: 'Open deal',
    });
  }
  if (m.projectId) {
    links.push({
      href: `/projects/${encodeURIComponent(m.projectId)}`,
      label: 'Open project',
    });
  }
  if (m.productId && m.projectId) {
    links.push({
      href: `/projects/${encodeURIComponent(m.projectId)}/products/${encodeURIComponent(m.productId)}`,
      label: 'Open product',
    });
  }
  if (m.contactId) {
    links.push({
      href: `/clients/contacts?${CLIENT_CONTACT_OPEN_QUERY}=${encodeURIComponent(m.contactId)}`,
      label: 'Open contact',
    });
  }
  if (links.length === 0) return null;
  return (
    <div className="border-border mt-4 border-t pt-4">
      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
        Links
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-primary hover:text-primary/80 text-sm font-medium underline-offset-4 hover:underline"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function MeetingDetailBody({ m }: { m: CalendarMeetingDetail }) {
  return (
    <div className="space-y-3 px-1 text-sm">
      <div className="flex flex-wrap gap-2">
        <span className="bg-secondary text-secondary-foreground rounded-lg px-2 py-0.5 text-xs font-medium">
          {formatEnumLabel(m.meetingType)}
        </span>
        <span className="text-muted-foreground rounded-lg border px-2 py-0.5 text-xs">
          {formatEnumLabel(m.status)}
        </span>
        <span className="text-muted-foreground rounded-lg border px-2 py-0.5 text-xs">
          {formatEnumLabel(m.locationType)}
        </span>
      </div>
      <p className="text-foreground">{formatRange(m.startsAt, m.endsAt, false)}</p>
      {m.locationOrLink ? (
        <p className="text-muted-foreground text-xs break-all">{m.locationOrLink}</p>
      ) : null}
      {m.agenda ? (
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-medium">Agenda</p>
          <p className="text-foreground whitespace-pre-wrap">{m.agenda}</p>
        </div>
      ) : null}
      {m.outcomeNotes ? (
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-medium">Outcome</p>
          <p className="text-foreground text-xs whitespace-pre-wrap">{m.outcomeNotes}</p>
        </div>
      ) : null}
      <MeetingDetailLinks m={m} />
    </div>
  );
}

function PersonalDetailBody({ p }: { p: CalendarPersonalEventDetail }) {
  return (
    <div className="space-y-3 px-1 text-sm">
      <span className="text-muted-foreground rounded-lg border px-2 py-0.5 text-xs">
        {formatEnumLabel(p.status)}
      </span>
      <p className="text-foreground">{formatRange(p.startsAt, p.endsAt, p.isAllDay)}</p>
      {p.notes ? (
        <div>
          <p className="text-muted-foreground mb-1 text-xs font-medium">Notes</p>
          <p className="text-foreground whitespace-pre-wrap">{p.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

export function CalendarEventDetailSheet({
  event,
  open,
  onOpenChange,
}: CalendarEventDetailSheetProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meeting, setMeeting] = useState<CalendarMeetingDetail | null>(null);
  const [personal, setPersonal] = useState<CalendarPersonalEventDetail | null>(null);

  useEffect(() => {
    if (!open || !event) {
      setMeeting(null);
      setPersonal(null);
      setError(null);
      return;
    }
    if (event.sourceType !== 'MEETING' && event.sourceType !== 'PERSONAL_EVENT') {
      setMeeting(null);
      setPersonal(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setMeeting(null);
    setPersonal(null);

    void (async () => {
      try {
        if (event.sourceType === 'MEETING') {
          const d = await calendarApi.getMeeting(event.sourceId);
          if (!cancelled) setMeeting(d);
        } else {
          const d = await calendarApi.getPersonalEvent(event.sourceId);
          if (!cancelled) setPersonal(d);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load event'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, event?.id, event?.sourceType, event?.sourceId]);

  const title =
    event?.sourceType === 'MEETING'
      ? 'Meeting'
      : event?.sourceType === 'PERSONAL_EVENT'
        ? 'Personal'
        : 'Event';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full max-w-md flex-col gap-0 overflow-hidden p-0"
      >
        <SheetHeader className="border-border shrink-0 border-b px-5 py-4">
          <SheetTitle className="text-foreground text-left text-lg font-semibold">
            {event?.title ?? title}
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 px-5 py-4">
          {!event ? (
            <p className="text-muted-foreground text-sm">No event selected.</p>
          ) : event.sourceType === 'PRODUCT_DEADLINE' ||
            event.sourceType === 'EXTENSION_DEADLINE' ? (
            <p className="text-muted-foreground text-sm">
              Open the delivery card from the calendar link.
            </p>
          ) : loading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : meeting ? (
            <MeetingDetailBody m={meeting} />
          ) : personal ? (
            <PersonalDetailBody p={personal} />
          ) : (
            <p className="text-muted-foreground text-sm">No details.</p>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
