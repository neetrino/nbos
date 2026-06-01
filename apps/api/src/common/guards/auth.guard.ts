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
import { TokenDenylistService } from '../security/token-denylist.service';

interface JwtPayload {
  sub: string;
  email: string;
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
    private readonly tokenDenylist: TokenDenylistService,
  ) {
    this.jwtSecret = this.configService.getOrThrow<string>('JWT_SECRET');
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string>;
      user?: Record<string, unknown>;
    }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (this.tokenDenylist.isRevoked(payload.jti)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const user: Record<string, unknown> = {
      employeeId: payload.sub,
      email: payload.email,
    };
    if (payload.jti) {
      user.jti = payload.jti;
    }
    if (typeof payload.exp === 'number') {
      user.tokenExp = payload.exp;
    }
    request.user = user;

    return true;
  }
}
