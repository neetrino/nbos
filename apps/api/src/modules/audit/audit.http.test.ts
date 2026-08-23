import 'reflect-metadata';
import {
  CanActivate,
  ExecutionContext,
  HttpStatus,
  Injectable,
  type INestApplication,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CurrentUserPayload } from '../../common/decorators';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

const AUDIT_ENTITY_URL = '/api/audit?entityType=CALL&entityId=call-1';
const AUDIT_USER_URL = '/api/audit/user/emp-1';
const NOTE_CHANGES = { oldNote: 'secret note', newNote: 'leaked' };

let currentUser: CurrentUserPayload;

@Injectable()
class TestAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    context.switchToHttp().getRequest<{ user: CurrentUserPayload }>().user = currentUser;
    return true;
  }
}

function userWithAuditScope(scope: string | undefined): CurrentUserPayload {
  return {
    id: 'emp-1',
    email: 'seller@nbos.test',
    role: 'seller',
    roleLevel: 1,
    departmentIds: [],
    firstName: 'Edgar',
    lastName: 'Sargsyan',
    permissions: scope === undefined ? {} : { AUDIT_LOGS_VIEW: scope },
  };
}

async function bootAuditHttpApp(auditService: Pick<AuditService, 'findByEntity' | 'findByUser'>) {
  const moduleRef = await Test.createTestingModule({
    controllers: [AuditController],
    providers: [
      { provide: AuditService, useValue: auditService },
      { provide: APP_GUARD, useClass: TestAuthGuard },
      { provide: APP_GUARD, useClass: PermissionGuard },
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  return app;
}

async function getJson(baseUrl: string, path: string) {
  const response = await fetch(new URL(path, baseUrl));
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

describe('Audit HTTP authorization', () => {
  const auditService = {
    findByEntity: vi.fn(),
    findByUser: vi.fn(),
  };
  let app: INestApplication | undefined;
  let baseUrl = '';

  beforeAll(async () => {
    app = await bootAuditHttpApp(auditService);
    baseUrl = await app.getUrl();
  });

  beforeEach(() => {
    auditService.findByEntity.mockReset();
    auditService.findByUser.mockReset();
    auditService.findByEntity.mockResolvedValue({ items: [{ changes: NOTE_CHANGES }], meta: {} });
    auditService.findByUser.mockResolvedValue({ items: [{ changes: NOTE_CHANGES }], meta: {} });
  });

  afterAll(async () => {
    await app?.close();
  });

  it.each([
    ['missing AUDIT_LOGS.VIEW', undefined],
    ['AUDIT_LOGS.VIEW NONE', 'NONE'],
  ] as const)(
    'returns 403 for %s on both endpoints before reading notes',
    async (_label, scope) => {
      currentUser = userWithAuditScope(scope);

      const entity = await getJson(baseUrl, AUDIT_ENTITY_URL);
      const user = await getJson(baseUrl, AUDIT_USER_URL);

      expect(entity.status).toBe(HttpStatus.FORBIDDEN);
      expect(user.status).toBe(HttpStatus.FORBIDDEN);
      expect(JSON.stringify(entity.body)).not.toContain('secret note');
      expect(JSON.stringify(user.body)).not.toContain('secret note');
      expect(auditService.findByEntity).not.toHaveBeenCalled();
      expect(auditService.findByUser).not.toHaveBeenCalled();
    },
  );

  it('allows AUDIT_LOGS.VIEW and reaches the service', async () => {
    currentUser = userWithAuditScope('ALL');

    const entity = await getJson(baseUrl, AUDIT_ENTITY_URL);
    const user = await getJson(baseUrl, AUDIT_USER_URL);

    expect(entity.status).toBe(HttpStatus.OK);
    expect(user.status).toBe(HttpStatus.OK);
    expect(auditService.findByEntity).toHaveBeenCalledWith('CALL', 'call-1', expect.any(Object));
    expect(auditService.findByUser).toHaveBeenCalledWith('emp-1', expect.any(Object));
  });
});
