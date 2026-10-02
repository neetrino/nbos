'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePermission } from '@/lib/permissions';
import { isVideoMeetingsWebFeatureEnabled } from '@/lib/video-meetings/feature-flag';
import { videoMeetingsApi, type PendingColleagueInvite } from '@/lib/api/video-meetings';
import { VIDEO_MEETING_COLLEAGUE_INVITE_POLL_MS } from './constants';
import { resolveVideoMeetingDisplayTitle } from './video-meeting-title';

/**
 * In-app Accept/Decline prompt for pending colleague video-meeting invites.
 * Polls the dedicated inbox endpoint; SSE notification feed still bumps unread
 * so hosts/colleagues notice without a full page reload.
 */
export function VideoMeetingColleagueInvitePrompt() {
  const enabled = isVideoMeetingsWebFeatureEnabled();
  const { me, can } = usePermission();
  const canView = can('VIEW', 'VIDEO_MEETINGS');
  const t = useTranslations('videoMeetings');
  const router = useRouter();
  const [pending, setPending] = useState<PendingColleagueInvite[]>([]);
  const [busy, setBusy] = useState(false);
  const current = pending[0] ?? null;

  const refresh = useCallback(async () => {
    if (!enabled || !me?.id || !canView) {
      setPending([]);
      return;
    }
    try {
      setPending(await videoMeetingsApi.listPendingColleagueInvites());
    } catch {
      /* keep last known list */
    }
  }, [canView, enabled, me?.id]);

  useEffect(() => {
    if (!enabled || !me?.id) return undefined;
    void refresh();
    const timer = window.setInterval(() => void refresh(), VIDEO_MEETING_COLLEAGUE_INVITE_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [enabled, me?.id, refresh]);

  const dismissCurrent = () => {
    setPending((rows) => rows.filter((row) => row.meetingId !== current?.meetingId));
  };

  const onAccept = async () => {
    if (!current || busy) return;
    setBusy(true);
    try {
      const result = await videoMeetingsApi.acceptColleagueInvite(current.meetingId);
      dismissCurrent();
      if (result.meetingStatus === 'ACTIVE') {
        router.push(`/video-meetings/${current.meetingId}/room`);
      } else {
        router.push(`/video-meetings/${current.meetingId}`);
      }
    } catch {
      /* leave dialog open for retry */
    } finally {
      setBusy(false);
    }
  };

  const onDecline = async () => {
    if (!current || busy) return;
    setBusy(true);
    try {
      await videoMeetingsApi.declineColleagueInvite(current.meetingId);
      dismissCurrent();
    } catch {
      /* leave dialog open for retry */
    } finally {
      setBusy(false);
    }
  };

  if (!current) return null;

  const title = resolveVideoMeetingDisplayTitle(current.meetingTitle, t('defaultTitle'));

  return (
    <Dialog open onOpenChange={() => undefined}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t('colleaguePrompt.title')}</DialogTitle>
          <DialogDescription>
            {t('colleaguePrompt.body', {
              inviter: current.invitedByDisplayName,
              meeting: title,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={() => void onDecline()}>
            {t('colleaguePrompt.decline')}
          </Button>
          <Button type="button" disabled={busy} onClick={() => void onAccept()}>
            {t('colleaguePrompt.accept')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
