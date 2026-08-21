import {
  Injectable,
  CanActivate,
  type ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators';
import { isV2AccessPayload } from '../../modules/auth/auth-session.tokens';
import { recordAuthMetric } from '../../modules/auth/auth-session.metrics';

interface JwtPayloadBase {
  sub: string;
  email?: string;
  jti?: string;
  iat: number;
  exp: number;
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly jwtSecret: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string>;
      user?: Record<string, unknown>;
    }>();
    const authHeader = request.headers['authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);
    let payload: JwtPayloadBase & Record<string, unknown>;
    try {
      payload = jwt.verify(token, this.jwtSecret) as JwtPayloadBase & Record<string, unknown>;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (!isV2AccessPayload(payload) || payload.typ !== 'access') {
      throw new UnauthorizedException('Invalid or expired token');
    }

    recordAuthMetric('auth_v2_token_requests_total');
    const user: Record<string, unknown> = {
      employeeId: payload.sub,
      email: payload.email,
      sessionId: payload.sid,
      tokenVersion: 2,
      authVersion: payload.authVersion,
    };
    if (payload.jti) user.jti = payload.jti;
    if (typeof payload.exp === 'number') user.tokenExp = payload.exp;
    request.user = user;
    return true;
  }
}
