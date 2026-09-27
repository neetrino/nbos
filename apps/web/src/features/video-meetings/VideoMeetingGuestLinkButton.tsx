'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { videoMeetingsApi } from '@/lib/api/video-meetings';
import { VIDEO_MEETING_INVITE_DEFAULT_TTL_HOURS } from './constants';
import { buildGuestInviteJoinUrl } from './video-meeting-title';

function inviteExpiryIso(): string {
  const date = new Date();
  date.setHours(date.getHours() + VIDEO_MEETING_INVITE_DEFAULT_TTL_HOURS);
  return date.toISOString();
}

/** One click creates a guest join link and copies it. */
export function VideoMeetingGuestLinkButton({ meetingId }: { meetingId: string }) {
  const t = useTranslations('videoMeetings');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const copy = async () => {
    if (busy) return;
    setBusy(true);
    setCopied(false);
    try {
      const created = await videoMeetingsApi.createInvite(meetingId, inviteExpiryIso());
      const url = created.joinUrl.startsWith('http')
        ? created.joinUrl
        : buildGuestInviteJoinUrl(created.token);
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="h-7 shrink-0 px-2.5 text-xs"
      disabled={busy}
      onClick={() => void copy()}
    >
      {copied ? t('actions.copied') : t('detail.copyGuestLink')}
    </Button>
  );
}
