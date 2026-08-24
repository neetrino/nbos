import { describe, expect, it } from 'vitest';
import { ATS_CALL_RECORDING_DEFAULT_MIME } from './ats-call-recording.constants';
import {
  recordingExtensionForMime,
  recordingPlaybackMime,
  resolveAtsRecordingMime,
  sniffAudioMime,
} from './ats-recording-mime';

describe('ats-recording-mime', () => {
  it('keeps an explicit audio content-type', () => {
    expect(
      resolveAtsRecordingMime({
        contentType: 'audio/wav; charset=binary',
        contentDisposition: 'attachment; filename=1787580255.177871.mp3',
        prefix: Buffer.from('ID3'),
      }),
    ).toBe('audio/wav');
  });

  it('uses filename when ATS sends octet-stream without sniffable prefix', () => {
    expect(
      resolveAtsRecordingMime({
        contentType: 'application/octet-stream',
        contentDisposition: 'attachment; filename=1787580255.177871.mp3',
        prefix: Buffer.from('xxxx'),
      }),
    ).toBe('audio/mpeg');
  });

  it('sniffs ID3 as mp3 when content-type is octet-stream', () => {
    expect(sniffAudioMime(Buffer.from([0x49, 0x44, 0x33, 0x03]))).toBe('audio/mpeg');
    expect(
      resolveAtsRecordingMime({
        contentType: 'application/octet-stream',
        contentDisposition: null,
        prefix: Buffer.from('ID3\u0003'),
      }),
    ).toBe('audio/mpeg');
  });

  it('maps stored octet-stream to audio/mpeg for browser playback', () => {
    expect(recordingPlaybackMime('application/octet-stream')).toBe('audio/mpeg');
    expect(recordingPlaybackMime('audio/ogg')).toBe('audio/ogg');
    expect(recordingPlaybackMime(null)).toBe('audio/mpeg');
    expect(recordingExtensionForMime('audio/mpeg')).toBe('.mp3');
    expect(recordingExtensionForMime('application/octet-stream')).toBe(
      recordingExtensionForMime(ATS_CALL_RECORDING_DEFAULT_MIME),
    );
  });
});
