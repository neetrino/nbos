import 'reflect-metadata';
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  UnauthorizedException,
  ValidationPipe,
  type INestApplication,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentUserPayload } from '../../common/decorators';
import { EmployeeInterfaceLocaleService } from './employee-interface-locale.service';
import { MePreferencesController } from './me-preferences.controller';

const AUTH_USER: CurrentUserPayload = {
  id: 'emp-1',
  email: 'seller@nbos.test',
  role: 'seller',
  roleLevel: 1,
  departmentIds: [],
  firstName: 'Edgar',
  lastName: 'Sargsyan',
  permissions: {},
};

const PREFERENCES_URL = '/api/v1/me/preferences';

@Injectable()
class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getRequest<{ user: CurrentUserPayload }>().user = AUTH_USER;
    return true;
  }
}

@Injectable()
class RejectAuthGuard implements CanActivate {
  canActivate(): boolean {
    throw new UnauthorizedException();
  }
}

async function bootPreferencesApp(
  service: Pick<EmployeeInterfaceLocaleService, 'getPreferences' | 'updatePreferences'>,
  guard: new () => CanActivate,
) {
  const moduleRef = await Test.createTestingModule({
    controllers: [MePreferencesController],
    providers: [
      { provide: EmployeeInterfaceLocaleService, useValue: service },
      { provide: APP_GUARD, useClass: guard },
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

describe('GET|PATCH /api/v1/me/preferences HTTP contract', () => {
  const getPreferences = vi.fn();
  const updatePreferences = vi.fn();
  let app: INestApplication | undefined;
  let baseUrl = '';

  beforeAll(async () => {
    app = await bootPreferencesApp({ getPreferences, updatePreferences }, TestAuthGuard);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app?.close();
  });

  beforeEach(() => {
    getPreferences.mockReset();
    updatePreferences.mockReset();
    getPreferences.mockResolvedValue({ interfaceLocale: 'en' });
    updatePreferences.mockResolvedValue({ interfaceLocale: 'ru' });
  });

  it('returns the stored locale for the authenticated employee', async () => {
    const response = await fetch(new URL(PREFERENCES_URL, baseUrl));
    expect(response.status).toBe(HttpStatus.OK);
    expect(getPreferences).toHaveBeenCalledWith('emp-1');
  });

  it('saves a writable locale for the authenticated employee only', async () => {
    const response = await fetch(new URL(PREFERENCES_URL, baseUrl), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interfaceLocale: 'ru' }),
    });
    expect(response.status).toBe(HttpStatus.OK);
    expect(updatePreferences).toHaveBeenCalledWith('emp-1', 'ru');
  });

  it('rejects reserved and unknown locales without writing', async () => {
    const reserved = await fetch(new URL(PREFERENCES_URL, baseUrl), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interfaceLocale: 'hy' }),
    });
    const unknown = await fetch(new URL(PREFERENCES_URL, baseUrl), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interfaceLocale: 'de' }),
    });
    expect(reserved.status).toBe(HttpStatus.BAD_REQUEST);
    expect(unknown.status).toBe(HttpStatus.BAD_REQUEST);
    expect(updatePreferences).not.toHaveBeenCalled();
  });

  it('rejects client-supplied employeeId', async () => {
    const response = await fetch(new URL(PREFERENCES_URL, baseUrl), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interfaceLocale: 'ru', employeeId: 'emp-other' }),
    });
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(updatePreferences).not.toHaveBeenCalled();
  });
});

describe('GET /api/v1/me/preferences unauthenticated', () => {
  const getPreferences = vi.fn();
  const updatePreferences = vi.fn();
  let app: INestApplication | undefined;

  beforeAll(async () => {
    app = await bootPreferencesApp({ getPreferences, updatePreferences }, RejectAuthGuard);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('rejects missing authentication', async () => {
    const response = await fetch(new URL(PREFERENCES_URL, await app!.getUrl()));
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(getPreferences).not.toHaveBeenCalled();
  });
});
