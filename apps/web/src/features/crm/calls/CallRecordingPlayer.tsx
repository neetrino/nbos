import { callRecordingSrc } from '@/lib/api/calls';

/** ATS stores MP3 even when the URL has no extension; the type hint lets the player read duration. */
export function CallRecordingPlayer({ callId }: { callId: string }) {
  return (
    <audio className="w-full" controls preload="metadata">
      <source src={callRecordingSrc(callId)} type="audio/mpeg" />
      Play
    </audio>
  );
}
