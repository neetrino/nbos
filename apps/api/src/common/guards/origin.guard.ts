import { Injectable, CanActivate, type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { parseCorsOriginsFromEnv } from '../../security/cors-origins';
import { isMutatingHttpMethod, resolveRequestOrigin } from '../../security/request-origin';

/**
 * CSRF defense-in-depth for browser clients: mutating requests with an Origin
 * or Referer must match the CORS allowlist. Non-browser clients (scheduler,
 * curl) omit both headers and are allowed — they use service keys or Bearer tokens
 * without cookie credentials.
 */
@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowedOrigins: ReadonlySet<string>;

  constructor() {
    this.allowedOrigins = new Set(parseCorsOriginsFromEnv());
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      method: string;
      headers: Record<string, string | string[] | undefined>;
    }>();

    if (!isMutatingHttpMethod(request.method)) {
      return true;
    }

    const originHeader = headerValue(request.headers['origin']);
    const refererHeader = headerValue(request.headers['referer']);
    const origin = resolveRequestOrigin(originHeader, refererHeader);

    if (!origin) {
      return true;
    }

    if (!this.allowedOrigins.has(origin)) {
      throw new ForbiddenException('Origin not allowed');
    }

    return true;
  }
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}
