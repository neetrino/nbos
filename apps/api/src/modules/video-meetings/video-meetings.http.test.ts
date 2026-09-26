import 'reflect-metadata';
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  UnauthorizedException,
  type INestApplication,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { IS_PUBLIC_KEY, type CurrentUserPayload } from '../../common/decorators';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { VIDEO_MEETINGS_FEATURE_ENABLED_TOKEN } from './video-meetings.constants';
import { VideoMeetingsController } from './video-meetings.controller';
import { VideoMeetingsFeatureGuard } from './video-meetings-feature.guard';
import { VideoMeetingsFeatureService } from './video-meetings-feature.service';
import { VideoMeetingsService } from './video-meetings.service';

const BASE = '/api/video-meetings';

let currentUser: CurrentUserPayload | null = null;

@Injectable()
class TestAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    if (!currentUser) throw new UnauthorizedException();
    context.switchToHttp().getRequest<{ user: CurrentUserPayload }>().user = currentUser;
    return true;
  }
}

function userWith(permissions: Record<string, string>): CurrentUserPayload {
  return {
    id: 'emp-1',
    email: 'user@nbos.test',
    role: 'owner',
    roleLevel: 0,
    departmentIds: [],
    firstName: 'Test',
    lastName: 'User',
    permissions,
  };
}

type MockService = {
  create: ReturnType<typeof vi.fn>;
  list: ReturnType<typeof vi.fn>;
  history: ReturnType<typeof vi.fn>;
  getCard: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
  cancel: ReturnType<typeof vi.fn>;
  attachEntityLink: ReturnType<typeof vi.fn>;
  detachEntityLink: ReturnType<typeof vi.fn>;
};

async function bootApp(featureEnabled: boolean): Promise<{
  app: INestApplication;
  service: MockService;
}> {
  const service: MockService = {
    create: vi.fn().mockResolvedValue({ id: 'm1', title: 'Instant meeting' }),
    list: vi.fn().mockResolvedValue({ items: [], meta: { page: 1, pageSize: 20, total: 0 } }),
    history: vi.fn().mockResolvedValue({ items: [], meta: { page: 1, pageSize: 20, total: 0 } }),
    getCard: vi.fn().mockResolvedValue({ id: 'm1' }),
    start: vi.fn().mockResolvedValue({ id: 'm1', sessions: [] }),
    end: vi.fn().mockResolvedValue({ id: 'm1' }),
    cancel: vi.fn().mockResolvedValue({ id: 'm1' }),
    attachEntityLink: vi.fn().mockResolvedValue({ id: 'm1' }),
    detachEntityLink: vi.fn().mockResolvedValue({ id: 'm1' }),
  };

  const moduleRef = await Test.createTestingModule({
    controllers: [VideoMeetingsController],
    providers: [
      { provide: VideoMeetingsService, useValue: service },
      { provide: ConfigService, useValue: { get: () => undefined } },
      { provide: VIDEO_MEETINGS_FEATURE_ENABLED_TOKEN, useValue: featureEnabled },
      VideoMeetingsFeatureService,
      VideoMeetingsFeatureGuard,
      { provide: APP_GUARD, useClass: TestAuthGuard },
      { provide: APP_GUARD, useClass: PermissionGuard },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  return { app, service };
}

describe('VideoMeetings HTTP', () => {
  let enabledApp: INestApplication;
  let disabledApp: INestApplication;
  let enabledBase = '';
  let disabledBase = '';
  let service: MockService;

  beforeAll(async () => {
    const enabled = await bootApp(true);
    enabledApp = enabled.app;
    service = enabled.service;
    enabledBase = await enabledApp.getUrl();

    const disabled = await bootApp(false);
    disabledApp = disabled.app;
    disabledBase = await disabledApp.getUrl();
  });

  afterAll(async () => {
    await enabledApp?.close();
    await disabledApp?.close();
  });

  beforeEach(() => {
    currentUser = userWith({
      VIDEO_MEETINGS_VIEW: 'ALL',
      VIDEO_MEETINGS_ADD: 'ALL',
      VIDEO_MEETINGS_EDIT: 'ALL',
    });
    for (const fn of Object.values(service)) {
      fn.mockClear();
    }
  });

  it('returns 404 for all routes when feature flag is off', async () => {
    const response = await fetch(new URL(BASE, disabledBase), { method: 'GET' });
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('rejects caller without VIDEO_MEETINGS permission with 403', async () => {
    currentUser = userWith({});
    const response = await fetch(new URL(BASE, enabledBase), { method: 'GET' });
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it('CALLS permission does not substitute for VIDEO_MEETINGS', async () => {
    currentUser = userWith({ CALLS_VIEW: 'ALL', CALLS_PLAY: 'ALL' });
    const response = await fetch(new URL(BASE, enabledBase), { method: 'GET' });
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
    expect(service.list).not.toHaveBeenCalled();
  });

  it('authorized create reaches the service', async () => {
    const response = await fetch(new URL(BASE, enabledBase), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Standup' }),
    });
    expect(response.status).toBe(HttpStatus.CREATED);
    expect(service.create).toHaveBeenCalled();
  });

  it('guest / public join paths are absent — controller is not @Public', () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, VideoMeetingsController)).not.toBe(true);
    for (const key of Object.getOwnPropertyNames(VideoMeetingsController.prototype)) {
      if (key === 'constructor') continue;
      const handler = VideoMeetingsController.prototype[key as keyof VideoMeetingsController];
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).not.toBe(true);
    }
  });

  it('unauthenticated request is rejected (401)', async () => {
    currentUser = null;
    const response = await fetch(new URL(BASE, enabledBase), { method: 'GET' });
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('probe of guest join path returns 404', async () => {
    currentUser = userWith({ VIDEO_MEETINGS_VIEW: 'ALL' });
    const response = await fetch(new URL(`${BASE}/guest/join`, enabledBase), { method: 'GET' });
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});
