'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import { CalendarClock, History, Video } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { VideoMeetingListItem, VideoMeetingStatus } from '@/lib/api/video-meetings';
import { cn } from '@/lib/utils';
import { resolveVideoMeetingDisplayTitle } from './video-meeting-title';

const STATUS_TONE: Record<VideoMeetingStatus, string> = {
  ACTIVE: 'bg-success/15 text-success',
  CREATED: 'bg-primary/10 text-primary',
  WAITING: 'bg-primary/10 text-primary',
  IDLE: 'bg-muted text-muted-foreground',
  ENDED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-muted text-muted-foreground',
};

type MeetingBoardItems = {
  active: VideoMeetingListItem[];
  upcoming: VideoMeetingListItem[];
  history: VideoMeetingListItem[];
};

/** Active, then upcoming, then history — one page, no tabs. */
export function VideoMeetingListStack({ boards }: { boards: MeetingBoardItems }) {
  const t = useTranslations('videoMeetings');

  return (
    <div className="flex flex-col gap-4">
      <VideoMeetingListBoard
        title={t('tabs.active')}
        icon={Video}
        items={boards.active}
        emptyLabel={t('empty.active')}
      />
      <VideoMeetingListBoard
        title={t('tabs.upcoming')}
        icon={CalendarClock}
        items={boards.upcoming}
        emptyLabel={t('empty.upcoming')}
      />
      <VideoMeetingListBoard
        title={t('tabs.history')}
        icon={History}
        items={boards.history}
        emptyLabel={t('empty.history')}
      />
    </div>
  );
}

type VideoMeetingListBoardProps = {
  title: string;
  icon: LucideIcon;
  items: VideoMeetingListItem[];
  emptyLabel: string;
};

/** One band of the meetings list: active, upcoming, or history. */
export function VideoMeetingListBoard({
  title,
  icon: Icon,
  items,
  emptyLabel,
}: VideoMeetingListBoardProps) {
  return (
    <section className="border-border bg-card relative overflow-hidden rounded-2xl border p-4">
      <div className="bg-primary/15 pointer-events-none absolute -top-12 -right-8 size-28 rounded-full blur-2xl" />
      <div className="relative flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
            <Icon size={15} aria-hidden />
          </div>
          <h2 className="truncate text-sm font-semibold">{title}</h2>
        </div>
        <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium tabular-nums">
          {items.length}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground relative mt-3 text-sm">{emptyLabel}</p>
      ) : (
        <ul className="relative mt-3 flex flex-col gap-1">
          {items.map((item) => (
            <VideoMeetingListRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function VideoMeetingListRow({ item }: { item: VideoMeetingListItem }) {
  const t = useTranslations('videoMeetings');
  const title = resolveVideoMeetingDisplayTitle(item.title, t('defaultTitle'));

  return (
    <li>
      <Link
        href={`/video-meetings/${item.id}`}
        className="hover:bg-muted/70 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors"
      >
        <span
          className={cn(
            'size-2 shrink-0 rounded-full',
            item.status === 'ACTIVE' ? 'bg-success' : 'bg-primary/40',
          )}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{title}</span>
          <span className="text-muted-foreground block truncate text-xs">
            {t('list.lastActivity')}: {format(new Date(item.lastActivityAt), 'PPp')}
            {' · '}
            {t('list.recordingCount', { count: item.recordingCount })}
          </span>
        </span>
        <span
          className={cn(
            'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
            STATUS_TONE[item.status],
          )}
        >
          {t(`status.${item.status}`)}
        </span>
      </Link>
    </li>
  );
}
