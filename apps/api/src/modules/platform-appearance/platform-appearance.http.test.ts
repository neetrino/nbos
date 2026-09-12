import 'reflect-metadata';
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  UnauthorizedException,
  type INestApplication,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { IS_PUBLIC_KEY, type CurrentUserPayload } from '../../common/decorators';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { PlatformAppearanceController } from './platform-appearance.controller';
import { PlatformAppearanceService } from './platform-appearance.service';

const APPEARANCE_URL = '/api/v1/platform/appearance';
const LIGHT_URL = '/api/v1/platform/appearance/wallpaper/light';

let currentUser: CurrentUserPayload;

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

function userWithCompanyEdit(scope: string | undefined): CurrentUserPayload {
  return {
    id: 'emp-1',
    email: 'admin@nbos.test',
    role: 'admin',
    roleLevel: 0,
    departmentIds: [],
    firstName: 'Ada',
    lastName: 'Admin',
    permissions: scope === undefined ? {} : { COMPANY_EDIT: scope },
  };
}

async function bootAppearanceApp(
  service: Pick<
    PlatformAppearanceService,
    'getAppearance' | 'uploadWallpaper' | 'clearWallpaper' | 'readWallpaperBytes'
  >,
) {
  const moduleRef = await Test.createTestingModule({
    controllers: [PlatformAppearanceController],
    providers: [
      { provide: PlatformAppearanceService, useValue: service },
      { provide: APP_GUARD, useClass: TestAuthGuard },
      { provide: APP_GUARD, useClass: PermissionGuard },
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  return app;
}

describe('Platform appearance HTTP', () => {
  const service = {
    getAppearance: vi.fn(),
    uploadWallpaper: vi.fn(),
    clearWallpaper: vi.fn(),
    readWallpaperBytes: vi.fn(),
  };
  let app: INestApplication | undefined;
  let baseUrl = '';

  beforeAll(async () => {
    app = await bootAppearanceApp(service);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    service.getAppearance.mockReset();
    service.uploadWallpaper.mockReset();
    service.clearWallpaper.mockReset();
    service.readWallpaperBytes.mockReset();
    service.getAppearance.mockResolvedValue({ light: null, dark: null });
    service.uploadWallpaper.mockResolvedValue({ light: { version: 1 }, dark: null });
    service.clearWallpaper.mockResolvedValue({ light: null, dark: null });
    service.readWallpaperBytes.mockResolvedValue(Buffer.from('WEBP'));
  });

  it('returns metadata for an authenticated employee', async () => {
    currentUser = userWithCompanyEdit('ALL');
    const response = await fetch(new URL(APPEARANCE_URL, baseUrl));
    expect(response.status).toBe(HttpStatus.OK);
    expect(service.getAppearance).toHaveBeenCalledOnce();
  });

  it('forbids wallpaper writes without COMPANY.EDIT', async () => {
    currentUser = userWithCompanyEdit(undefined);
    const denied = await fetch(new URL(LIGHT_URL, baseUrl), { method: 'DELETE' });
    expect(denied.status).toBe(HttpStatus.FORBIDDEN);
    expect(service.clearWallpaper).not.toHaveBeenCalled();
  });

  it('clears a slot when COMPANY.EDIT is granted', async () => {
    currentUser = userWithCompanyEdit('ALL');
    const response = await fetch(new URL(LIGHT_URL, baseUrl), { method: 'DELETE' });
    expect(response.status).toBe(HttpStatus.OK);
    expect(service.clearWallpaper).toHaveBeenCalledWith('light', 'emp-1');
  });

  it('serves wallpaper bytes without authentication', async () => {
    currentUser = undefined as unknown as CurrentUserPayload;
    const response = await fetch(new URL(`${LIGHT_URL}?v=1`, baseUrl));
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.headers.get('content-type')).toContain('image/webp');
    expect(response.headers.get('cache-control')).toContain('max-age=31536000');
    expect(await response.text()).toBe('WEBP');
    expect(service.readWallpaperBytes).toHaveBeenCalledWith('light');
  });

  it('rejects an unknown slot', async () => {
    currentUser = userWithCompanyEdit('ALL');
    const response = await fetch(new URL(`${APPEARANCE_URL}/wallpaper/sepia`, baseUrl), {
      method: 'DELETE',
    });
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(service.clearWallpaper).not.toHaveBeenCalled();
  });
});
