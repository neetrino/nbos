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
import { requireClickToCallIdempotencyKey } from '../click-to-call-idempotency';
import { ActiveCallScreenService } from '../active-call-screen.service';
import { CallNoteService } from '../call-note.service';

const CLICK_URL = '/api/crm/calls/click-to-call';
const KEY = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
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

async function bootClickToCallHttpApp(start: ReturnType<typeof vi.fn>) {
  const moduleRef = await Test.createTestingModule({
    controllers: [CallsController],
    providers: [
      { provide: CallsService, useValue: { findAll: vi.fn(), findById: vi.fn() } },
      { provide: CallsRecordingService, useValue: { streamRecording: vi.fn() } },
      { provide: ClickToCallService, useValue: { start } },
      { provide: ActiveCallScreenService, useValue: { getScreen: vi.fn() } },
      { provide: CallNoteService, useValue: { updateNote: vi.fn() } },
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

async function postClickToCall(
  baseUrl: string,
  body: unknown,
  headers: Record<string, string> = {},
) {
  const response = await fetch(new URL(CLICK_URL, baseUrl), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

describe('POST /crm/calls/click-to-call HTTP contract', () => {
  const start = vi.fn();
  let app: INestApplication | undefined;
  let baseUrl = '';

  beforeAll(async () => {
    app = await bootClickToCallHttpApp(start);
    baseUrl = await app.getUrl();
  });

  beforeEach(() => {
    start.mockReset();
    start.mockImplementation((_dto, _user, key: string | undefined) => {
      requireClickToCallIdempotencyKey(key);
      return Promise.resolve({ id: 'call-1' });
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('forwards Idempotency-Key from the header, not the body', async () => {
    const result = await postClickToCall(
      baseUrl,
      { targetType: 'LEAD', targetId: '11111111-1111-4111-8111-111111111111' },
      { 'Idempotency-Key': KEY },
    );
    expect(result.status).toBe(HttpStatus.CREATED);
    expect(start).toHaveBeenCalledWith(
      expect.objectContaining({ targetType: 'LEAD' }),
      expect.objectContaining({ id: 'emp-1' }),
      KEY,
    );
  });

  it('does not take the idempotency key from the JSON body', async () => {
    const result = await postClickToCall(baseUrl, {
      targetType: 'LEAD',
      targetId: '11111111-1111-4111-8111-111111111111',
      idempotencyKey: KEY,
    });
    expect(result.status).toBe(HttpStatus.BAD_REQUEST);
    expect(start).not.toHaveBeenCalled();
  });

  it('rejects a missing or invalid Idempotency-Key header', async () => {
    const missing = await postClickToCall(baseUrl, {
      targetType: 'LEAD',
      targetId: '11111111-1111-4111-8111-111111111111',
    });
    expect(missing.status).toBe(HttpStatus.BAD_REQUEST);
    const invalid = await postClickToCall(
      baseUrl,
      { targetType: 'LEAD', targetId: '11111111-1111-4111-8111-111111111111' },
      { 'Idempotency-Key': 'not-a-uuid' },
    );
    expect(invalid.status).toBe(HttpStatus.BAD_REQUEST);
    expect(start).toHaveBeenCalled();
  });
});
