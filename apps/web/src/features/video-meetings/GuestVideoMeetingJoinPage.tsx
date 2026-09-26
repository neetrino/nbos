'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingState } from '@/components/shared';
import {
  guestDecideConsent,
  guestPrejoin,
  guestToken,
  type ConsentDecision,
  type GuestPrejoinResult,
  type GuestJoinResult,
} from '@/lib/api/video-meetings';
import { GuestDevicePreview } from './GuestDevicePreview';
import { VideoMeetingLiveKitRoom } from './VideoMeetingLiveKitRoom';
import { VideoMeetingRecordingIndicator } from './VideoMeetingRecordingIndicator';

type GuestPhase = 'form' | 'waiting' | 'rejected' | 'room' | 'error';

function GuestJoinContent() {
  const t = useTranslations('videoMeetings.guest');
  const tRecording = useTranslations('videoMeetings.recording');
  const params = useSearchParams();
  const inviteToken = params.get('invite')?.trim() ?? '';
  const [displayName, setDisplayName] = useState('');
  const [phase, setPhase] = useState<GuestPhase>(inviteToken ? 'form' : 'error');
  const [prejoin, setPrejoin] = useState<GuestPrejoinResult | null>(null);
  const [join, setJoin] = useState<GuestJoinResult | null>(null);
  const [error, setError] = useState('');
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentMessage, setConsentMessage] = useState<string | null>(null);

  const consentBody = useMemo(() => {
    const override = process.env.NEXT_PUBLIC_VIDEO_MEETINGS_CONSENT_DISCLOSURE?.trim();
    return override && override.length > 0 ? override : t('consentBody');
  }, [t]);

  const pollForToken = useCallback(async () => {
    if (!inviteToken) return;
    try {
      const creds = await guestToken(inviteToken);
      setJoin(creds);
      setPhase('room');
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '';
      if (message.includes('503') || message.toLowerCase().includes('livekit')) {
        setError(t('livekitUnavailable'));
        setPhase('error');
      }
    }
  }, [inviteToken, t]);

  const handlePrejoin = async () => {
    if (!inviteToken || !displayName.trim()) return;
    setError('');
    try {
      const result = await guestPrejoin(inviteToken, displayName.trim());
      setPrejoin(result);
      if (result.admissionState === 'REJECTED') {
        setPhase('rejected');
        return;
      }
      setPhase('waiting');
      void pollForToken();
    } catch {
      setPhase('error');
      setError(t('prejoinError'));
    }
  };

  const handleConsent = async (decision: ConsentDecision) => {
    if (!inviteToken) return;
    setConsentBusy(true);
    setConsentMessage(null);
    try {
      await guestDecideConsent(inviteToken, decision);
      setConsentMessage(tRecording('consentSaved'));
    } catch {
      setConsentMessage(tRecording('consentError'));
    } finally {
      setConsentBusy(false);
    }
  };

  useEffect(() => {
    if (phase !== 'waiting') {
      return;
    }
    const timer = window.setInterval(() => void pollForToken(), 4000);
    return () => window.clearInterval(timer);
  }, [phase, pollForToken]);

  if (!inviteToken && phase === 'error') {
    return <p className="text-destructive text-sm">{t('invalidInvite')}</p>;
  }

  if (phase === 'room' && join) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={consentBusy}
            onClick={() => void handleConsent('GRANTED')}
          >
            {tRecording('consentGrant')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={consentBusy}
            onClick={() => void handleConsent('REVOKED')}
          >
            {tRecording('consentRevoke')}
          </Button>
        </div>
        {consentMessage && <p className="text-muted-foreground text-xs">{consentMessage}</p>}
        <VideoMeetingLiveKitRoom
          credentials={join}
          guestInviteToken={inviteToken}
          onDisconnected={() => {
            setJoin(null);
            setPhase('waiting');
            void pollForToken();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-4">
      {phase === 'form' && (
        <>
          <GuestDevicePreview />
          <label className="flex flex-col gap-1 text-sm">
            <span>{t('displayName')}</span>
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t('displayNamePlaceholder')}
            />
          </label>
          <div className="border-border bg-muted/30 rounded-lg border p-3 text-sm">
            <p className="font-medium">{t('consentLabel')}</p>
            <p className="text-muted-foreground mt-1 text-xs">{consentBody}</p>
          </div>
          <Button type="button" onClick={() => void handlePrejoin()} disabled={!displayName.trim()}>
            {t('joinWaitingRoom')}
          </Button>
        </>
      )}
      {phase === 'waiting' && (
        <div className="flex flex-col gap-3">
          <div className="border-border rounded-lg border p-4 text-sm">
            <p className="font-medium">{t('waitingTitle')}</p>
            <p className="text-muted-foreground mt-1">{t('waitingBody')}</p>
            {prejoin?.admissionState === 'ADMITTED' && (
              <Button type="button" className="mt-3" onClick={() => void pollForToken()}>
                {t('enterRoom')}
              </Button>
            )}
          </div>
          <div className="border-border bg-muted/30 rounded-lg border p-3 text-sm">
            <p className="font-medium">{t('consentLabel')}</p>
            <p className="text-muted-foreground mt-1 text-xs">{consentBody}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={consentBusy}
                onClick={() => void handleConsent('GRANTED')}
              >
                {tRecording('consentGrant')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={consentBusy}
                onClick={() => void handleConsent('DECLINED')}
              >
                {tRecording('consentDecline')}
              </Button>
            </div>
            {consentMessage && (
              <p className="text-muted-foreground mt-2 text-xs">{consentMessage}</p>
            )}
          </div>
          <VideoMeetingRecordingIndicator guestInviteToken={inviteToken} compact />
        </div>
      )}
      {phase === 'rejected' && (
        <div className="border-border rounded-lg border p-4 text-sm">
          <p className="font-medium">{t('rejectedTitle')}</p>
          <p className="text-muted-foreground mt-1">{t('rejectedBody')}</p>
        </div>
      )}
      {phase === 'error' && <p className="text-destructive text-sm">{error || t('tokenError')}</p>}
    </div>
  );
}

export function GuestVideoMeetingJoinPage() {
  const t = useTranslations('videoMeetings.guest');

  return (
    <div data-video-meeting-guest-shell="true" className="bg-background flex min-h-dvh flex-col">
      <header className="border-border border-b px-6 py-4">
        <p className="text-primary text-sm font-semibold tracking-wide">NBOS</p>
        <h1 className="text-xl font-semibold">{t('title')}</h1>
      </header>
      <main className="flex flex-1 flex-col px-6 py-8">
        <Suspense fallback={<LoadingState count={2} />}>
          <GuestJoinContent />
        </Suspense>
      </main>
    </div>
  );
}
