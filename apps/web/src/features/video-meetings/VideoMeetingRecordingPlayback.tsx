'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  videoMeetingsApi,
  type VideoMeetingRecordingGroup,
  type VideoMeetingRecordingStatus,
} from '@/lib/api/video-meetings';

type VideoMeetingRecordingPlaybackProps = {
  meetingId: string;
  recording: VideoMeetingRecordingGroup | null;
  /** Host may see per-asset audio status; playback is composite-only. */
  isHost: boolean;
};

const GROUP_STATUS_KEYS = {
  PENDING: 'groupStatus.PENDING',
  RECORDING: 'groupStatus.RECORDING',
  FINALIZING: 'groupStatus.FINALIZING',
  READY: 'groupStatus.READY',
  PARTIAL: 'groupStatus.PARTIAL',
  FAILED: 'groupStatus.FAILED',
} as const satisfies Record<
  VideoMeetingRecordingStatus,
  | 'groupStatus.PENDING'
  | 'groupStatus.RECORDING'
  | 'groupStatus.FINALIZING'
  | 'groupStatus.READY'
  | 'groupStatus.PARTIAL'
  | 'groupStatus.FAILED'
>;

const ASSET_STATUS_KEYS = {
  PENDING: 'assetStatus.PENDING',
  READY: 'assetStatus.READY',
  FAILED: 'assetStatus.FAILED',
  MISSING: 'assetStatus.MISSING',
} as const;

/**
 * Honest READY / PARTIAL / FAILED + composite playback via short-lived signed URL.
 * Raw participant audio is listed for the host only — never offered as a public download.
 */
export function VideoMeetingRecordingPlayback({
  meetingId,
  recording,
  isHost,
}: VideoMeetingRecordingPlaybackProps) {
  const t = useTranslations('videoMeetings.recording');
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const composite = recording?.assets.find((a) => a.kind === 'ROOM_COMPOSITE');
  const canPlay = composite?.status === 'READY';
  const showTerminal =
    recording &&
    (recording.status === 'READY' ||
      recording.status === 'PARTIAL' ||
      recording.status === 'FAILED');

  const loadPlayback = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await videoMeetingsApi.getRecordingPlayback(meetingId);
      setPlaybackUrl(result.url);
    } catch {
      setError(t('playbackError'));
      setPlaybackUrl(null);
    } finally {
      setBusy(false);
    }
  }, [meetingId, t]);

  if (!showTerminal || !recording) return null;

  const audioAssets = recording.assets.filter((a) => a.kind === 'PARTICIPANT_AUDIO');

  return (
    <section className="border-border flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <h2 className="text-sm font-medium">{t('playbackTitle')}</h2>
        <p className="text-muted-foreground text-sm">{t(GROUP_STATUS_KEYS[recording.status])}</p>
      </div>

      {canPlay ? (
        <div className="flex flex-col gap-2">
          {!playbackUrl ? (
            <Button type="button" size="sm" disabled={busy} onClick={() => void loadPlayback()}>
              {busy ? t('playbackLoading') : t('playComposite')}
            </Button>
          ) : (
            <video className="bg-muted max-h-80 w-full rounded-md" controls src={playbackUrl}>
              <track kind="captions" />
            </video>
          )}
          {error && <p className="text-destructive text-xs">{error}</p>}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">{t('compositeNotReady')}</p>
      )}

      {isHost && audioAssets.length > 0 && (
        <div>
          <h3 className="mb-1 text-xs font-medium tracking-wide uppercase">
            {t('audioAssetsTitle')}
          </h3>
          <ul className="text-muted-foreground space-y-1 text-sm">
            {audioAssets.map((asset) => (
              <li key={asset.id}>
                {asset.participantId
                  ? t('audioAssetParticipant', { id: asset.participantId.slice(0, 8) })
                  : t('audioAssetUnknown')}{' '}
                · {t(ASSET_STATUS_KEYS[asset.status])}
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground mt-1 text-xs">{t('audioAssetsHint')}</p>
        </div>
      )}
    </section>
  );
}
