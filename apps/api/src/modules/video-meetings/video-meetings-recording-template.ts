/**
 * Page Chrome inside LiveKit Egress loads.
 * The stock template waits for a published track before START_RECORDING,
 * so a call with camera and microphone off never produces a file.
 * This page starts as soon as it joins and draws each person as an avatar
 * with their name, the same way the call stage does when the camera is off.
 * A camera or screen share replaces that tile while the track is live.
 */
export const VIDEO_MEETING_RECORDING_TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>NBOS recording</title>
  <style>
    html, body { margin: 0; height: 100%; background: #0b1020; color: #f8fafc; font-family: ui-sans-serif, system-ui, sans-serif; }
    #stage { box-sizing: border-box; display: flex; height: 100%; align-items: center; justify-content: center; flex-wrap: wrap; gap: 28px; padding: 32px; background: radial-gradient(circle at top, #1e293b, #0b1020 58%); }
    .tile { display: flex; flex-direction: column; align-items: center; gap: 14px; }
    .avatar { width: 148px; height: 148px; border-radius: 999px; display: flex; align-items: center; justify-content: center; font-size: 48px; font-weight: 600; background: #334155; box-shadow: 0 18px 40px rgba(0, 0, 0, 0.35); }
    .name { margin: 0; font-size: 28px; font-weight: 600; letter-spacing: -0.02em; }
    .video { display: none; }
    .tile.has-video .avatar, .tile.has-video .name { display: none; }
    .tile.has-video .video { display: block; }
    .video video { width: min(420px, 70vw); height: 280px; border-radius: 24px; object-fit: cover; background: #111827; }
    .video.screen video { width: min(1100px, 92vw); height: min(720px, 80vh); object-fit: contain; }
    audio { position: absolute; width: 0; height: 0; }
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
    const tiles = new Map();

    function initials(name) {
      const parts = String(name || '').trim().split(/\\s+/).filter(Boolean);
      if (parts.length === 0) return '?';
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    function ensureTile(participant) {
      const existing = tiles.get(participant.identity);
      if (existing) return existing;
      const el = document.createElement('div');
      el.className = 'tile';
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = initials(participant.name || participant.identity);
      const label = document.createElement('p');
      label.className = 'name';
      label.textContent = participant.name || participant.identity;
      const videoSlot = document.createElement('div');
      videoSlot.className = 'video';
      el.append(videoSlot, avatar, label);
      stage.appendChild(el);
      const tile = { el, videoSlot };
      tiles.set(participant.identity, tile);
      return tile;
    }

    function visibleVideo(participant) {
      let camera = null;
      let screen = null;
      for (const publication of participant.trackPublications.values()) {
        const track = publication.track;
        if (!track || track.kind !== 'video' || publication.isMuted) continue;
        if (publication.source === 'screen_share') screen = track;
        else camera = track;
      }
      return screen ? { track: screen, screen: true } : camera ? { track: camera, screen: false } : null;
    }

    function paint(participant) {
      const tile = ensureTile(participant);
      const chosen = visibleVideo(participant);
      tile.videoSlot.replaceChildren();
      tile.videoSlot.classList.toggle('screen', Boolean(chosen && chosen.screen));
      tile.el.classList.toggle('has-video', Boolean(chosen));
      if (chosen) tile.videoSlot.appendChild(chosen.track.attach());
    }

    function attachAudio(track) {
      if (track.kind !== 'audio') return;
      stage.appendChild(track.attach());
    }

    if (!url || !token || !stage) {
      console.error('NBOS recording template is missing url or token');
    } else {
      const room = new Room();
      room.on(RoomEvent.ParticipantConnected, (participant) => paint(participant));
      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        const tile = tiles.get(participant.identity);
        if (tile) tile.el.remove();
        tiles.delete(participant.identity);
      });
      room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
        if (track.kind === 'audio') attachAudio(track);
        else paint(participant);
      });
      room.on(RoomEvent.TrackUnsubscribed, (_track, _publication, participant) => paint(participant));
      room.on(RoomEvent.TrackMuted, (_publication, participant) => paint(participant));
      room.on(RoomEvent.TrackUnmuted, (_publication, participant) => paint(participant));
      room.on(RoomEvent.Disconnected, () => console.log('END_RECORDING'));
      await room.connect(url, token);
      for (const participant of room.remoteParticipants.values()) {
        paint(participant);
        for (const publication of participant.trackPublications.values()) {
          if (publication.track) attachAudio(publication.track);
        }
      }
      console.log('START_RECORDING');
    }
  </script>
</body>
</html>
`;
