import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqualStr } from '../utils/crypto';

const SERVICE_KEY_HEADER = 'x-scheduler-key';
const BEARER_PREFIX = 'Bearer ';

/**
 * Authenticates machine-to-machine (cron) callers via a shared service key
 * instead of a user JWT. Use on routes marked `@Public()` so the user-auth
 * chain is skipped. The key must be sent in `x-scheduler-key` or as a
 * `Authorization: Bearer <key>` header.
 *
 * - Production: `SCHEDULER_API_KEY` is required (validated at boot); missing
 *   key or mismatch → 401.
 * - Non-production: if `SCHEDULER_API_KEY` is unset, calls are allowed (local
 *   cron testing) with a warning.
 */
@Injectable()
export class ServiceApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ServiceApiKeyGuard.name);

  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.configService.get<string>('SCHEDULER_API_KEY');

    if (!expected) {
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Scheduler API key is not configured');
      }
      this.logger.warn('SCHEDULER_API_KEY not set; allowing scheduler call (non-production only).');
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
    }>();
    const provided = extractServiceKey(request.headers);

    if (!provided || !timingSafeEqualStr(provided, expected)) {
      throw new UnauthorizedException('Invalid scheduler API key');
    }

    return true;
  }
}

function extractServiceKey(headers: Record<string, string | undefined>): string | undefined {
  const headerKey = headers[SERVICE_KEY_HEADER];
  if (headerKey) return headerKey;

  const authHeader = headers['authorization'];
  if (authHeader?.startsWith(BEARER_PREFIX)) {
    return authHeader.slice(BEARER_PREFIX.length);
  }

  return undefined;
}
