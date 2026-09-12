const RIFF = 0x52494646;
const WEBP = 0x57454250;
const VP8X = 0x56503858;
const VP8_LOSSY = 0x56503820;
const VP8L = 0x5650384c;
const VP8X_ANIMATION_FLAG = 0x02;
const RIFF_HEADER_BYTES = 12;
const CHUNK_HEADER_BYTES = 8;

export type WebpImageSize = {
  width: number;
  height: number;
  animated: boolean;
};

export function sniffWebpImage(bytes: Uint8Array): WebpImageSize | null {
  if (bytes.length < RIFF_HEADER_BYTES + CHUNK_HEADER_BYTES) return null;
  if (readU32Be(bytes, 0) !== RIFF || readU32Be(bytes, 8) !== WEBP) return null;

  let offset = RIFF_HEADER_BYTES;
  while (offset + CHUNK_HEADER_BYTES <= bytes.length) {
    const fourcc = readU32Be(bytes, offset);
    const payloadSize = readU32Le(bytes, offset + 4);
    const payloadStart = offset + CHUNK_HEADER_BYTES;
    if (payloadStart + payloadSize > bytes.length) return null;
    const payload = bytes.subarray(payloadStart, payloadStart + payloadSize);
    const size = readChunkSize(fourcc, payload);
    if (size) return size;
    offset = payloadStart + payloadSize + (payloadSize % 2);
  }
  return null;
}

function readChunkSize(fourcc: number, payload: Uint8Array): WebpImageSize | null {
  if (fourcc === VP8X) return readVp8x(payload);
  if (fourcc === VP8L) return readVp8l(payload);
  if (fourcc === VP8_LOSSY) return readVp8(payload);
  return null;
}

function readVp8x(payload: Uint8Array): WebpImageSize | null {
  if (payload.length < 10) return null;
  return {
    width: readU24Le(payload, 4) + 1,
    height: readU24Le(payload, 7) + 1,
    animated: (payload[0] & VP8X_ANIMATION_FLAG) !== 0,
  };
}

function readVp8l(payload: Uint8Array): WebpImageSize | null {
  if (payload.length < 5 || payload[0] !== 0x2f) return null;
  const bits = payload[1] | (payload[2] << 8) | (payload[3] << 16) | (payload[4] << 24);
  return {
    width: (bits & 0x3fff) + 1,
    height: ((bits >> 14) & 0x3fff) + 1,
    animated: false,
  };
}

function readVp8(payload: Uint8Array): WebpImageSize | null {
  if (payload.length < 10) return null;
  if (payload[3] !== 0x9d || payload[4] !== 0x01 || payload[5] !== 0x2a) return null;
  return {
    width: readU16Le(payload, 6) & 0x3fff,
    height: readU16Le(payload, 8) & 0x3fff,
    animated: false,
  };
}

function readU32Be(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] << 24) |
      (bytes[offset + 1] << 16) |
      (bytes[offset + 2] << 8) |
      bytes[offset + 3]) >>>
    0
  );
}

function readU32Le(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] |
      (bytes[offset + 1] << 8) |
      (bytes[offset + 2] << 16) |
      (bytes[offset + 3] << 24)) >>>
    0
  );
}

function readU16Le(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readU24Le(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}
