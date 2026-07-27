import { afterEach, describe, expect, it } from 'vitest';
import {
  assertProcessRoleForEntrypoint,
  resolveProcessRole,
  shouldRegisterBullmqWorkers,
  shouldRegisterQueueProducers,
  shouldRegisterScheduledJobs,
  shouldStartPublicHttpApi,
} from './process-role';

describe('process-role', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  it('defaults to all in non-production when unset', () => {
    delete process.env.PROCESS_ROLE;
    process.env.NODE_ENV = 'development';
    expect(resolveProcessRole()).toBe('all');
  });

  it('requires PROCESS_ROLE in production', () => {
    delete process.env.PROCESS_ROLE;
    process.env.NODE_ENV = 'production';
    expect(() => resolveProcessRole()).toThrow(/PROCESS_ROLE is required/);
  });

  it('forbids all in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.PROCESS_ROLE = 'all';
    expect(() => resolveProcessRole()).toThrow(/forbidden in production/);
  });

  it('accepts api and worker in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.PROCESS_ROLE = 'api';
    expect(resolveProcessRole()).toBe('api');
    process.env.PROCESS_ROLE = 'worker';
    expect(resolveProcessRole()).toBe('worker');
  });

  it('rejects invalid role', () => {
    process.env.NODE_ENV = 'development';
    process.env.PROCESS_ROLE = 'web';
    expect(() => resolveProcessRole()).toThrow(/Invalid PROCESS_ROLE/);
  });

  it('api entrypoint rejects worker role', () => {
    process.env.NODE_ENV = 'development';
    process.env.PROCESS_ROLE = 'worker';
    expect(() => assertProcessRoleForEntrypoint('api')).toThrow(/Entrypoint "api"/);
  });

  it('api role does not register workers; worker role does', () => {
    process.env.NODE_ENV = 'development';
    process.env.PROCESS_ROLE = 'api';
    expect(shouldRegisterBullmqWorkers()).toBe(false);
    expect(shouldRegisterQueueProducers()).toBe(true);
    expect(shouldStartPublicHttpApi()).toBe(true);
    expect(shouldRegisterScheduledJobs()).toBe(false);

    process.env.PROCESS_ROLE = 'worker';
    expect(shouldRegisterBullmqWorkers()).toBe(true);
    expect(shouldStartPublicHttpApi()).toBe(false);
    expect(shouldRegisterScheduledJobs()).toBe(false);

    process.env.PROCESS_ROLE = 'scheduler';
    expect(shouldRegisterScheduledJobs()).toBe(true);
    expect(shouldRegisterBullmqWorkers()).toBe(false);
  });
});
