import 'reflect-metadata';
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentUserPayload } from '../../../common/decorators';
import { CallsController } from '../calls.controller';
import { CallsRecordingService } from '../calls-recording.service';
import { CallsService } from '../calls.service';
import { ClickToCallService } from '../click-to-call.service';
import { ActiveCallScreenService } from '../active-call-screen.service';
import { CallNoteService } from '../call-note.service';

const CALL_ID = '11111111-1111-4111-8111-111111111111';
const NOTE_URL = `/api/crm/calls/${CALL_ID}/note`;

const AUTH_USER: CurrentUserPayload = {
  id: 'emp-1',
  email: 'seller@nbos.test',
  role: 'seller',
  roleLevel: 1,
  departmentIds: [],
  firstName: 'Edgar',
  lastName: 'Sargsyan',
  permissions: { CRM_LEADS_EDIT: 'ALL', CRM_LEADS_VIEW: 'ALL' },
};

@Injectable()
class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getRequest<{ user: CurrentUserPayload }>().user = AUTH_USER;
    return true;
  }
}

async function bootNoteHttpApp(updateNote: ReturnType<typeof vi.fn>) {
  const moduleRef = await Test.createTestingModule({
    controllers: [CallsController],
    providers: [
      { provide: CallsService, useValue: { findAll: vi.fn(), findById: vi.fn() } },
      { provide: CallsRecordingService, useValue: { streamRecording: vi.fn() } },
      { provide: ClickToCallService, useValue: { start: vi.fn() } },
      { provide: ActiveCallScreenService, useValue: { getScreen: vi.fn() } },
      { provide: CallNoteService, useValue: { updateNote } },
      { provide: APP_GUARD, useClass: TestAuthGuard },
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  await app.listen(0, '127.0.0.1');
  return app;
}

async function patchNote(baseUrl: string, body: unknown) {
  const response = await fetch(new URL(NOTE_URL, baseUrl), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

describe('PATCH /crm/calls/:id/note HTTP contract', () => {
  const updateNote = vi.fn();
  let app: INestApplication | undefined;
  let baseUrl = '';

  beforeAll(async () => {
    app = await bootNoteHttpApp(updateNote);
    baseUrl = await app.getUrl();
  });

  beforeEach(() => {
    updateNote.mockReset();
    updateNote.mockResolvedValue({ callId: CALL_ID, note: null, noteVersion: 1 });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects a missing note field before calling the service', async () => {
    const result = await patchNote(baseUrl, { expectedNoteVersion: 0 });
    expect(result.status).toBe(HttpStatus.BAD_REQUEST);
    expect(updateNote).not.toHaveBeenCalled();
  });

  it('accepts an explicit null note and forwards it', async () => {
    const result = await patchNote(baseUrl, { note: null, expectedNoteVersion: 0 });
    expect(result.status).toBe(HttpStatus.OK);
    expect(updateNote).toHaveBeenCalledWith(CALL_ID, null, 0, expect.any(Object));
  });
});
