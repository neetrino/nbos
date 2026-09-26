'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Plus, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataView, EmptyState, PageHero } from '@/components/shared';
import { usePermission } from '@/lib/permissions';
import { videoMeetingsApi, type VideoMeetingListItem } from '@/lib/api/video-meetings';

type ListTab = 'active' | 'upcoming' | 'history';

async function loadTab(tab: ListTab): Promise<VideoMeetingListItem[]> {
  if (tab === 'history') {
    return (await videoMeetingsApi.history()).items;
  }
  if (tab === 'active') {
    return (await videoMeetingsApi.list('ACTIVE')).items;
  }
  const [created, waiting] = await Promise.all([
    videoMeetingsApi.list('CREATED'),
    videoMeetingsApi.list('WAITING'),
  ]);
  return [...created.items, ...waiting.items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function VideoMeetingsListPage() {
  const t = useTranslations('videoMeetings');
  const router = useRouter();
  const { can } = usePermission();
  const [tab, setTab] = useState<ListTab>('active');
  const [items, setItems] = useState<VideoMeetingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async (nextTab: ListTab) => {
    setLoading(true);
    setError(false);
    try {
      setItems(await loadTab(nextTab));
    } catch {
      setError(true);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(tab);
  }, [refresh, tab]);

  const handleCreate = async () => {
    setCreating(true);
    try {
      const meeting = await videoMeetingsApi.create();
      router.push(`/video-meetings/${meeting.id}`);
    } catch {
      setError(true);
    } finally {
      setCreating(false);
    }
  };

  const emptyKey =
    tab === 'active' ? 'empty.active' : tab === 'upcoming' ? 'empty.upcoming' : 'empty.history';

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <PageHero
        title={t('title')}
        trailing={
          can('ADD', 'VIDEO_MEETINGS') ? (
            <Button type="button" onClick={() => void handleCreate()} disabled={creating}>
              <Plus className="size-4" aria-hidden />
              {creating ? t('actions.creating') : t('actions.newMeeting')}
            </Button>
          ) : undefined
        }
      />
      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as ListTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <TabsList aria-label={t('tabs.aria')}>
          <TabsTrigger value="active">{t('tabs.active')}</TabsTrigger>
          <TabsTrigger value="upcoming">{t('tabs.upcoming')}</TabsTrigger>
          <TabsTrigger value="history">{t('tabs.history')}</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4 min-h-0 flex-1">
          <DataView
            loading={loading}
            error={error ? t('loadError') : null}
            hasData={items.length > 0}
            loadingFallback={<p className="text-muted-foreground text-sm">{t('loading')}</p>}
            errorFallback={
              <p className="text-destructive text-sm" role="alert">
                {t('loadError')}
              </p>
            }
            emptyFallback={<EmptyState icon={Video} title={t(emptyKey)} />}
          >
            <ul className="divide-border border-border divide-y rounded-lg border">
              {items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {t('list.status')}: {t(`status.${item.status}`)} · {t('list.created')}{' '}
                      {format(new Date(item.createdAt), 'PPp')}
                    </p>
                  </div>
                  <Link
                    href={`/video-meetings/${item.id}`}
                    className="border-border hover:bg-muted/90 inline-flex h-7 items-center rounded-lg border px-2.5 text-sm"
                  >
                    {t('actions.openDetail')}
                  </Link>
                </li>
              ))}
            </ul>
          </DataView>
        </TabsContent>
      </Tabs>
    </div>
  );
}
