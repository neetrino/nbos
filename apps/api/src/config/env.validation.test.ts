import { describe, it, expect } from 'vitest';
import { validateEnv } from './env.validation';

const STRONG = 'a'.repeat(40);

const validProd = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://app_user:pw@host/db?sslmode=require',
  JWT_SECRET: STRONG,
  CREDENTIALS_ENCRYPTION_KEY: STRONG,
  CORS_ORIGIN: 'https://app.example.com',
  SCHEDULER_API_KEY: STRONG,
};

describe('validateEnv', () => {
  it('passes a complete production config', () => {
    expect(() => validateEnv({ ...validProd })).not.toThrow();
  });

  it('requires core secrets in every environment', () => {
    expect(() => validateEnv({ NODE_ENV: 'development' })).toThrow(/DATABASE_URL is required/);
  });

  it('rejects placeholder secrets in production', () => {
    expect(() =>
      validateEnv({
        ...validProd,
        JWT_SECRET: 'your-super-secret-jwt-key-change-this-in-production',
      }),
    ).toThrow(/placeholder/i);
  });

  it('rejects short secrets in production', () => {
    expect(() => validateEnv({ ...validProd, JWT_SECRET: 'short' })).toThrow(/at least 32/);
  });

  it('requires CORS_ORIGIN and SCHEDULER_API_KEY in production', () => {
    const { CORS_ORIGIN, SCHEDULER_API_KEY, ...rest } = validProd;
    void CORS_ORIGIN;
    void SCHEDULER_API_KEY;
    expect(() => validateEnv(rest)).toThrow(/required in production/);
  });

  it('rejects placeholder SCHEDULER_API_KEY in production', () => {
    expect(() =>
      validateEnv({
        ...validProd,
        SCHEDULER_API_KEY: 'change-this-scheduler-key',
      }),
    ).toThrow(/placeholder/i);
  });

  it('does not enforce strength/placeholder outside production', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'development',
        DATABASE_URL: 'x',
        JWT_SECRET: 'dev-weak',
        CREDENTIALS_ENCRYPTION_KEY: 'dev-weak',
      }),
    ).not.toThrow();
  });
});
