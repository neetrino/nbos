/**
 * Page Chrome inside LiveKit Egress loads.
 * The stock template waits for a published track before START_RECORDING,
 * so a call with camera and microphone off never produces a file.
 * This page starts as soon as it joins, then attaches tracks as they appear.
 */
export const VIDEO_MEETING_RECORDING_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>NBOS recording</title>
  <style>
    html, body { margin: 0; height: 100%; background: #111; color: #fff; }
    #stage { display: flex; flex-wrap: wrap; height: 100%; align-content: center; justify-content: center; gap: 8px; }
    video { width: 480px; max-width: 100%; background: #222; object-fit: cover; }
  </style>
</head>
<body>
  <div id="stage"></div>
  <script type="module">
    import { Room, RoomEvent } from 'https://cdn.jsdelivr.net/npm/livekit-client@2.15.8/dist/livekit-client.esm.mjs';
    const params = new URLSearchParams(location.search);
    const url = params.get('url');
    const token = params.get('token');
    const stage = document.getElementById('stage');
    if (!url || !token || !stage) {
      console.error('NBOS recording template is missing url or token');
    } else {
      const room = new Room();
      const attach = (track) => {
        if (track.kind !== 'video' && track.kind !== 'audio') return;
        stage.appendChild(track.attach());
      };
      room.on(RoomEvent.TrackSubscribed, (track) => attach(track));
      room.on(RoomEvent.Disconnected, () => console.log('END_RECORDING'));
      await room.connect(url, token);
      for (const participant of room.remoteParticipants.values()) {
        for (const publication of participant.trackPublications.values()) {
          if (publication.track) attach(publication.track);
        }
      }
      console.log('START_RECORDING');
    }
  </script>
</body>
</html>
`;
