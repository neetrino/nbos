import { describe, it, expect, vi } from 'vitest';
import { TransformInterceptor } from './transform.interceptor';
import { of, lastValueFrom } from 'rxjs';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

describe('TransformInterceptor', () => {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(false),
  } as unknown as Reflector;
  const interceptor = new TransformInterceptor(reflector);
  const mockContext = {
    getHandler: vi.fn(),
    getClass: vi.fn(),
  } as unknown as ExecutionContext;

  it('wraps response data', async () => {
    const handler: CallHandler = {
      handle: () => of({ id: 1, name: 'test' }),
    };

    const result = await lastValueFrom(interceptor.intercept(mockContext, handler));
    expect(result).toMatchObject({ data: { id: 1, name: 'test' } });
    expect(result).toHaveProperty('timestamp');
  });

  it('wraps null response', async () => {
    const handler: CallHandler = {
      handle: () => of(null),
    };

    const result = await lastValueFrom(interceptor.intercept(mockContext, handler));
    expect(result).toMatchObject({ data: null });
    expect(result).toHaveProperty('timestamp');
  });

  it('wraps array response', async () => {
    const handler: CallHandler = {
      handle: () => of([1, 2, 3]),
    };

    const result = await lastValueFrom(interceptor.intercept(mockContext, handler));
    expect(result).toMatchObject({ data: [1, 2, 3] });
  });

  it('timestamp is ISO string', async () => {
    const handler: CallHandler = {
      handle: () => of('data'),
    };

    const result = (await lastValueFrom(interceptor.intercept(mockContext, handler))) as {
      data: string;
      timestamp: string;
    };
    expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
  });
});
