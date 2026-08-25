import 'reflect-metadata';
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  StreamableFile,
  type INestApplication,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Readable } from 'node:stream';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentUserPayload } from '../../../common/decorators';
import { ActiveCallScreenService } from './active-call-screen.service';
import { CallNoteService } from './call-note.service';
import { CallsController } from './calls.controller';
import { fullRecordingHeaders, partialRecordingHeaders } from './calls-recording-playback';
import { CallsRecordingService } from './calls-recording.service';
import { CallsService } from './calls.service';
import { ClickToCallService } from './click-to-call.service';

const CALL_ID = 'e0006b6c-aa57-46d0-a9e5-af7febff7771';
const RECORDING_URL = `/api/crm/calls/${CALL_ID}/recording`;
const TOTAL = 34776;
const AUTH_USER: CurrentUserPayload = {
  id: 'emp-1',
  email: 'seller@nbos.test',
  role: 'seller',
  roleLevel: 1,
  departmentIds: [],
  firstName: 'Ada',
  lastName: 'Seller',
  permissions: { CRM_LEADS_VIEW: 'ALL' },
};

@Injectable()
class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getRequest<{ user: CurrentUserPayload }>().user = AUTH_USER;
    return true;
  }
}

async function bootRecordingHttpApp(streamRecording: ReturnType<typeof vi.fn>) {
  const moduleRef = await Test.createTestingModule({
    controllers: [CallsController],
    providers: [
      { provide: CallsService, useValue: { findAll: vi.fn(), findById: vi.fn() } },
      { provide: CallsRecordingService, useValue: { streamRecording } },
      { provide: ClickToCallService, useValue: { start: vi.fn() } },
      { provide: ActiveCallScreenService, useValue: { getScreen: vi.fn() } },
      { provide: CallNoteService, useValue: { updateNote: vi.fn() } },
      { provide: APP_GUARD, useClass: TestAuthGuard },
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  return app;
}

function audioFile(body: string, length: number): StreamableFile {
  return new StreamableFile(Readable.from([body]), {
    type: 'audio/mpeg',
    disposition: 'inline',
    length,
  });
}

describe('GET /crm/calls/:id/recording HTTP contract', () => {
  const streamRecording = vi.fn();
  let app: INestApplication | undefined;
  let baseUrl = '';

  beforeAll(async () => {
    app = await bootRecordingHttpApp(streamRecording);
    baseUrl = await app.getUrl();
  });

  beforeEach(() => {
    streamRecording.mockReset();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns 200 with length, accept-ranges, inline disposition, and cache-control', async () => {
    streamRecording.mockResolvedValue({
      kind: 'stream',
      status: 200,
      headers: fullRecordingHeaders('audio/mpeg', 4),
      file: audioFile('full', 4),
    });
    const response = await fetch(new URL(RECORDING_URL, baseUrl));
    expect(streamRecording).toHaveBeenCalledWith(CALL_ID, AUTH_USER, undefined);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.headers.get('content-type')).toMatch(/audio\/mpeg/u);
    expect(response.headers.get('content-length')).toBe('4');
    expect(response.headers.get('accept-ranges')).toBe('bytes');
    expect(response.headers.get('content-disposition')).toBe('inline');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('content-range')).toBeNull();
    expect(await response.text()).toBe('full');
  });

  it('forwards Range and returns 206 with Content-Range and range Content-Length', async () => {
    streamRecording.mockResolvedValue({
      kind: 'stream',
      status: 206,
      headers: partialRecordingHeaders('audio/mpeg', 0, 6, TOTAL),
      file: audioFile('partial', 7),
    });
    const response = await fetch(new URL(RECORDING_URL, baseUrl), {
      headers: { Range: 'bytes=0-6' },
    });
    expect(streamRecording).toHaveBeenCalledWith(CALL_ID, AUTH_USER, 'bytes=0-6');
    expect(response.status).toBe(HttpStatus.PARTIAL_CONTENT);
    expect(response.headers.get('content-range')).toBe(`bytes 0-6/${TOTAL}`);
    expect(response.headers.get('content-length')).toBe('7');
    expect(response.headers.get('accept-ranges')).toBe('bytes');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.text()).toBe('partial');
  });

  it('returns 416 with bytes */total for an unsatisfiable range', async () => {
    streamRecording.mockResolvedValue({ kind: 'unsatisfiable', totalSize: TOTAL });
    const response = await fetch(new URL(RECORDING_URL, baseUrl), {
      headers: { Range: `bytes=${TOTAL}-` },
    });
    expect(streamRecording).toHaveBeenCalledWith(CALL_ID, AUTH_USER, `bytes=${TOTAL}-`);
    expect(response.status).toBe(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE);
    expect(response.headers.get('content-range')).toBe(`bytes */${TOTAL}`);
    expect(response.headers.get('accept-ranges')).toBe('bytes');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
});
