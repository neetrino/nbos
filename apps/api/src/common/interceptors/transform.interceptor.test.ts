import { describe, it, expect } from 'vitest';
import { TransformInterceptor } from './transform.interceptor';
import { of, lastValueFrom } from 'rxjs';
import type { CallHandler, ExecutionContext } from '@nestjs/common';

describe('TransformInterceptor', () => {
  const interceptor = new TransformInterceptor();
  const mockContext = {} as ExecutionContext;

  it('wraps response data', async () => {
    const handler: CallHandler = {
      handle: () => of({ id: 1, name: 'test' }),
    };

    const result = await lastValueFrom(interceptor.intercept(mockContext, handler));
    expect(result.data).toEqual({ id: 1, name: 'test' });
    expect(result.timestamp).toBeDefined();
  });

  it('wraps null response', async () => {
    const handler: CallHandler = {
      handle: () => of(null),
    };

    const result = await lastValueFrom(interceptor.intercept(mockContext, handler));
    expect(result.data).toBeNull();
    expect(result.timestamp).toBeDefined();
  });

  it('wraps array response', async () => {
    const handler: CallHandler = {
      handle: () => of([1, 2, 3]),
    };

    const result = await lastValueFrom(interceptor.intercept(mockContext, handler));
    expect(result.data).toEqual([1, 2, 3]);
  });

  it('timestamp is ISO string', async () => {
    const handler: CallHandler = {
      handle: () => of('data'),
    };

    const result = await lastValueFrom(interceptor.intercept(mockContext, handler));
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });
});
