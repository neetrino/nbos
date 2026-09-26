'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataView, ErrorState, LoadingState, PageHero, PageHeroSearch } from '@/components/shared';
import { usePermission } from '@/lib/permissions';
import { videoMeetingsApi, type VideoMeetingListItem } from '@/lib/api/video-meetings';
import { VideoMeetingCreateDialog } from './VideoMeetingCreateDialog';
import { VideoMeetingListStack } from './VideoMeetingListBoard';
import { resolveVideoMeetingDisplayTitle } from './video-meeting-title';

type MeetingBoards = {
  active: VideoMeetingListItem[];
  upcoming: VideoMeetingListItem[];
  history: VideoMeetingListItem[];
};

const EMPTY_BOARDS: MeetingBoards = { active: [], upcoming: [], history: [] };

async function loadBoards(): Promise<MeetingBoards> {
  const [active, created, waiting, history] = await Promise.all([
    videoMeetingsApi.list('ACTIVE'),
    videoMeetingsApi.list('CREATED'),
    videoMeetingsApi.list('WAITING'),
    videoMeetingsApi.history(),
  ]);
  const upcoming = [...created.items, ...waiting.items].sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
  return { active: active.items, upcoming, history: history.items };
}

function filterBoard(items: VideoMeetingListItem[], query: string, fallbackTitle: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) =>
    resolveVideoMeetingDisplayTitle(item.title, fallbackTitle).toLowerCase().includes(needle),
  );
}

function useVideoMeetingBoards() {
  const [boards, setBoards] = useState<MeetingBoards>(EMPTY_BOARDS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setBoards(await loadBoards());
    } catch {
      setError(true);
      setBoards(EMPTY_BOARDS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { boards, loading, error, setError, refresh };
}

export function VideoMeetingsListPage() {
  const t = useTranslations('videoMeetings');
  const router = useRouter();
  const { can } = usePermission();
  const loaded = useVideoMeetingBoards();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const fallback = t('defaultTitle');
  const boards = useMemo(
    () => ({
      active: filterBoard(loaded.boards.active, query, fallback),
      upcoming: filterBoard(loaded.boards.upcoming, query, fallback),
      history: filterBoard(loaded.boards.history, query, fallback),
    }),
    [fallback, loaded.boards, query],
  );

  const handleCreate = async (title: string) => {
    setCreating(true);
    try {
      const meeting = await videoMeetingsApi.create(title);
      setCreateOpen(false);
      router.push(`/video-meetings/${meeting.id}`);
    } catch {
      loaded.setError(true);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHero
        title={t('title')}
        search={<PageHeroSearch value={query} onChange={setQuery} placeholder={t('list.search')} />}
        trailing={
          can('ADD', 'VIDEO_MEETINGS') ? (
            <Button type="button" onClick={() => setCreateOpen(true)} disabled={creating}>
              <Plus className="size-4" aria-hidden />
              {creating ? t('actions.creating') : t('actions.newMeeting')}
            </Button>
          ) : undefined
        }
      />
      <VideoMeetingCreateDialog
        open={createOpen}
        creating={creating}
        onOpenChange={setCreateOpen}
        onCreate={(title) => void handleCreate(title)}
      />
      <DataView
        loading={loaded.loading}
        error={loaded.error ? t('loadError') : null}
        hasData={!loaded.error}
        loadingFallback={<LoadingState variant="cards" count={3} />}
        errorFallback={
          <ErrorState description={t('loadError')} onRetry={() => void loaded.refresh()} />
        }
      >
        <VideoMeetingListStack boards={boards} />
      </DataView>
    </div>
  );
}
