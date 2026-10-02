'use client';

import { Maximize2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

type VideoMeetingRecordingPlayerDialogProps = {
  open: boolean;
  title: string;
  url: string | null;
  onOpenChange: (open: boolean) => void;
};

/** Large closable player above the meeting sheet. Native controls include fullscreen. */
export function VideoMeetingRecordingPlayerDialog({
  open,
  title,
  url,
  onOpenChange,
}: VideoMeetingRecordingPlayerDialogProps) {
  const t = useTranslations('videoMeetings.recording');
  const videoRef = useRef<HTMLVideoElement>(null);

  const enterFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    void video.requestFullscreen();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent forceNestedBackdrop mobileSheet={false} className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {open && url ? (
          <video
            ref={videoRef}
            className="aspect-video w-full rounded-xl bg-neutral-950"
            controls
            autoPlay
            playsInline
            src={url}
          >
            <track kind="captions" />
          </video>
        ) : null}
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={enterFullscreen}>
            <Maximize2 className="size-4" aria-hidden />
            {t('fullscreen')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
