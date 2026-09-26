'use client';

import { useEffect, useRef } from 'react';

/** Local camera preview before guest prejoin (no room connection). */
export function GuestDevicePreview() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      } catch {
        /* Permission denied or no device — prejoin still allowed. */
      }
    };

    void start();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="border-border aspect-video w-full max-w-md overflow-hidden rounded-lg border bg-black/5">
      <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
    </div>
  );
}
