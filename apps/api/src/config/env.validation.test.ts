import { describe, it, expect } from 'vitest';
import { validateEnv } from './env.validation';

const STRONG = 'a'.repeat(40);

const validProd = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://app_user:pw@host/db?sslmode=require',
  JWT_SECRET: STRONG,
  CREDENTIALS_ENCRYPTION_KEY: STRONG,
  BACKEND_URL: 'https://api.example.com',
  CORS_ORIGIN: 'https://app.example.com',
  SCHEDULER_API_KEY: STRONG,
  NBOS_FOUNDER_EMPLOYEE_ID: '14b22deb-5998-4bb5-aabe-f3ad5a0a6ff6',
  AUTH_REFRESH_TOKEN_PEPPER: STRONG,
  AUTH_REFRESH_COOKIE_NAME: 'nbos_refresh',
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

  it('requires NBOS_FOUNDER_EMPLOYEE_ID UUID in production', () => {
    const { NBOS_FOUNDER_EMPLOYEE_ID, ...rest } = validProd;
    void NBOS_FOUNDER_EMPLOYEE_ID;
    expect(() => validateEnv(rest)).toThrow(/NBOS_FOUNDER_EMPLOYEE_ID is required in production/);
    expect(() => validateEnv({ ...validProd, NBOS_FOUNDER_EMPLOYEE_ID: 'not-a-uuid' })).toThrow(
      /must be a UUID/,
    );
  });

  it('does not enforce strength/placeholder outside production', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'development',
        DATABASE_URL: 'x',
        JWT_SECRET: 'dev-weak',
        CREDENTIALS_ENCRYPTION_KEY: 'dev-weak',
        BACKEND_URL: 'http://localhost:4000',
        AUTH_REFRESH_TOKEN_PEPPER: STRONG,
        AUTH_REFRESH_COOKIE_NAME: 'nbos_refresh',
      }),
    ).not.toThrow();
  });
});
