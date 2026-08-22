import 'reflect-metadata';
import { Controller, Get, HttpStatus, type INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransformInterceptor } from '../../../common/interceptors/transform.interceptor';
import { AtsController } from './ats.controller';
import { AtsWebhookService } from './ats-webhook.service';

const ATS_WEBHOOK_TEST_KEY = 'test-ats-key';
const ATS_WEBHOOK_URL_PATH = '/api/integrations/ats/webhook';
const TRANSFORM_PROBE_URL_PATH = '/api/integrations/ats-transform-probe';
const REDIRECT_CALL_SIP = '3126107';

@Controller('integrations/ats-transform-probe')
class TransformProbeController {
  @Get()
  getProbe(): { status: 'success' } {
    return { status: 'success' };
  }
}

async function bootAtsWebhookHttpApp(
  handleWebhook: AtsWebhookService['handleWebhook'],
): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    controllers: [AtsController, TransformProbeController],
    providers: [
      { provide: AtsWebhookService, useValue: { handleWebhook } },
      { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api');
  await app.listen(0, '127.0.0.1');
  return app;
}

async function readJsonBody(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

async function postAtsWebhook(
  baseUrl: string,
  fields: Record<string, string>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const url = new URL(ATS_WEBHOOK_URL_PATH, baseUrl);
  url.searchParams.set('key', ATS_WEBHOOK_TEST_KEY);
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields).toString(),
  });
  return { status: response.status, body: await readJsonBody(response) };
}

function expectBareAtsSuccess(body: Record<string, unknown>, redirectCall?: string): void {
  if (redirectCall) {
    expect(body).toEqual({ status: 'success', redirect_call: redirectCall });
  } else {
    expect(body).toEqual({ status: 'success' });
  }
  expect(body).not.toHaveProperty('data');
  expect(body).not.toHaveProperty('timestamp');
}

describe('ATS webhook HTTP response contract', () => {
  const handleWebhook = vi.fn<AtsWebhookService['handleWebhook']>();
  let app: INestApplication | undefined;
  let baseUrl = '';

  beforeAll(async () => {
    app = await bootAtsWebhookHttpApp(handleWebhook);
    baseUrl = await app.getUrl();
  });

  beforeEach(() => {
    handleWebhook.mockReset();
    handleWebhook.mockResolvedValue({ status: 'success' });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('returns bare JSON success without data/timestamp wrapper', async () => {
    const result = await postAtsWebhook(baseUrl, {
      uid: 'call-1',
      state: 'start',
      calldirect: '0',
    });

    expect(result.status).toBe(HttpStatus.OK);
    expectBareAtsSuccess(result.body);
    expect(handleWebhook).toHaveBeenCalledOnce();
  });

  it('returns redirect_call on the top-level JSON object', async () => {
    handleWebhook.mockResolvedValue({
      status: 'success',
      redirect_call: REDIRECT_CALL_SIP,
    });

    const result = await postAtsWebhook(baseUrl, {
      uid: 'call-2',
      state: 'start',
      calldirect: '0',
      clid: '+37499123456',
    });

    expect(result.status).toBe(HttpStatus.OK);
    expectBareAtsSuccess(result.body, REDIRECT_CALL_SIP);
  });

  it('still wraps other handlers with data and timestamp', async () => {
    const response = await fetch(new URL(TRANSFORM_PROBE_URL_PATH, baseUrl));
    const body = await readJsonBody(response);

    expect(response.status).toBe(HttpStatus.OK);
    expect(body).toMatchObject({ data: { status: 'success' } });
    expect(body).toHaveProperty('timestamp');
    expect(body).not.toHaveProperty('status');
    expect(body).not.toHaveProperty('redirect_call');
  });
});
