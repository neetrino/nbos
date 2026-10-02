'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { videoMeetingsApi, type ConsentDecision } from '@/lib/api/video-meetings';

type VideoMeetingConsentActionsProps = {
  meetingId: string;
  /** Quiet text buttons for the call header. */
  compact?: boolean;
};

/** Employee self-consent actions for the current meeting participant. */
export function VideoMeetingConsentActions({
  meetingId,
  compact = false,
}: VideoMeetingConsentActionsProps) {
  const t = useTranslations('videoMeetings.recording');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const decide = async (decision: ConsentDecision) => {
    setBusy(true);
    setMessage(null);
    try {
      await videoMeetingsApi.decideConsent(meetingId, decision);
      setMessage(t('consentSaved'));
    } catch {
      setMessage(t('consentError'));
    } finally {
      setBusy(false);
    }
  };

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground text-xs"
          disabled={busy}
          onClick={() => void decide('GRANTED')}
        >
          {t('consentGrant')}
        </button>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground text-xs"
          disabled={busy}
          onClick={() => void decide('REVOKED')}
        >
          {t('consentRevoke')}
        </button>
        {message && <span className="text-muted-foreground text-xs">{message}</span>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => void decide('GRANTED')}
      >
        {t('consentGrant')}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy}
        onClick={() => void decide('REVOKED')}
      >
        {t('consentRevoke')}
      </Button>
      {message && <span className="text-muted-foreground text-xs">{message}</span>}
    </div>
  );
}
