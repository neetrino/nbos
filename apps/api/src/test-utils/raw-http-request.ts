import { connect, type Socket } from 'node:net';

export interface RawHttpResponse {
  status: number;
  headers: Record<string, string>;
  body: string;
}

export interface RawHttpRequestOptions {
  url: URL;
  method: string;
  headers: Record<string, string>;
  /** Written in order, as separate socket writes. */
  bodyChunks: readonly Buffer[];
  /** Frames the body with `Transfer-Encoding: chunked` and no declared length. */
  chunked?: boolean;
}

const STATUS_LINE_PARTS = 3;
const HEADER_SEPARATOR = '\r\n\r\n';

/**
 * Sends an HTTP/1.1 request over a bare socket.
 *
 * `fetch` and `node:http` both refuse to send a body that disagrees with its
 * declared length, which is exactly the case a byte ceiling has to survive.
 * Writing the frame by hand is the only way to test a chunked, absent or
 * understated `Content-Length` against a real server.
 */
export function rawHttpRequest(options: RawHttpRequestOptions): Promise<RawHttpResponse> {
  return new Promise((resolve, reject) => {
    const socket = connect({
      // `URL.hostname` keeps the brackets around an IPv6 literal, which is not
      // a host `net.connect` understands.
      host: options.url.hostname.replace(/^\[|\]$/g, ''),
      port: Number(options.url.port),
    });
    const received: Buffer[] = [];
    let transportError: Error | undefined;

    // Settled on `close` only: a server that refuses the body answers and then
    // hangs up mid-write, so the response can arrive after the write error.
    socket.on('data', (chunk: Buffer) => received.push(chunk));
    socket.on('error', (error: Error) => {
      transportError = error;
    });
    socket.on('close', () => {
      const raw = Buffer.concat(received).toString('utf8');
      if (raw.length === 0) {
        reject(transportError ?? new Error('The server closed the connection with no response'));
        return;
      }
      resolve(parseRawResponse(raw));
    });
    socket.on('connect', () => writeRequest(socket, options));
  });
}

/** Writes never fail the call: a refused body is the outcome under test. */
function writeRequest(socket: Socket, options: RawHttpRequestOptions): void {
  const ignoreWriteError = (): void => undefined;
  socket.write(buildRequestHead(options), ignoreWriteError);
  for (const chunk of options.bodyChunks) {
    if (socket.writableEnded || socket.destroyed) return;
    socket.write(options.chunked ? toHttpChunk(chunk) : chunk, ignoreWriteError);
  }
  if (options.chunked) socket.write('0\r\n\r\n', ignoreWriteError);
}

function buildRequestHead(options: RawHttpRequestOptions): string {
  const target = `${options.url.pathname}${options.url.search}`;
  const headers: Record<string, string> = {
    host: options.url.host,
    connection: 'close',
    ...options.headers,
    ...(options.chunked ? { 'transfer-encoding': 'chunked' } : {}),
  };
  const lines = Object.entries(headers).map(([name, value]) => `${name}: ${value}`);
  return `${options.method} ${target} HTTP/1.1\r\n${lines.join('\r\n')}${HEADER_SEPARATOR}`;
}

function toHttpChunk(chunk: Buffer): string {
  return `${chunk.length.toString(16)}\r\n${chunk.toString('utf8')}\r\n`;
}

function parseRawResponse(raw: string): RawHttpResponse {
  const separatorAt = raw.indexOf(HEADER_SEPARATOR);
  const head = separatorAt === -1 ? raw : raw.slice(0, separatorAt);
  const body = separatorAt === -1 ? '' : raw.slice(separatorAt + HEADER_SEPARATOR.length);
  const [statusLine, ...headerLines] = head.split('\r\n');
  const status = Number(statusLine?.split(' ', STATUS_LINE_PARTS)[1] ?? 0);
  const headers: Record<string, string> = {};
  for (const line of headerLines) {
    const colonAt = line.indexOf(':');
    if (colonAt > 0) {
      headers[line.slice(0, colonAt).trim().toLowerCase()] = line.slice(colonAt + 1).trim();
    }
  }
  return { status, headers, body };
}
