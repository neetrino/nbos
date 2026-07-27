import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  HttpCode,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { RefreshDto } from './dto/refresh.dto';
import { Public, CurrentUser, type CurrentUserPayload } from '../../common/decorators';
import {
  buildClearRefreshCookieOptions,
  buildRefreshCookieOptions,
  serializeRefreshCookie,
} from './auth-session.cookies';
import { resolveAuthRefreshCookieName } from './auth-session.flags';
import { assertRefreshCsrf } from './auth-session.csrf';

const ONE_MINUTE_MS = 60_000;
const FIVE_MINUTES_MS = 5 * ONE_MINUTE_MS;
const TEN_MINUTES_MS = 10 * ONE_MINUTE_MS;

const LOGIN_THROTTLE = { default: { limit: 10, ttl: ONE_MINUTE_MS } } as const;
const ACCEPT_INVITE_THROTTLE = { default: { limit: 5, ttl: TEN_MINUTES_MS } } as const;
const INVITE_INFO_THROTTLE = { default: { limit: 20, ttl: FIVE_MINUTES_MS } } as const;
const REFRESH_THROTTLE = { default: { limit: 30, ttl: ONE_MINUTE_MS } } as const;

@ApiTags('Auth')
@Controller('v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @Throttle(LOGIN_THROTTLE)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns access token and user info' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: { ip?: string; headers: Record<string, string | string[] | undefined> },
    @Res({ passthrough: true })
    res: { setHeader: (name: string, value: string | string[]) => void },
  ) {
    const result = await this.authService.login(dto.email, dto.password, {
      ip: req.ip,
      userAgent: headerValue(req.headers['user-agent']),
    });
    if (result.refreshToken) {
      const cookie = buildRefreshCookieOptions(result.refreshToken);
      res.setHeader('Set-Cookie', serializeRefreshCookie(cookie));
    }
    // Keep backward-compatible body; refreshToken is for BFF/Auth.js server only.
    return result;
  }

  @Post('refresh')
  @Public()
  @HttpCode(200)
  @Throttle(REFRESH_THROTTLE)
  @ApiOperation({ summary: 'Rotate refresh session and issue short access token' })
  async refresh(
    @Body() dto: RefreshDto,
    @Req()
    req: {
      ip?: string;
      headers: Record<string, string | string[] | undefined>;
    },
    @Res({ passthrough: true })
    res: { setHeader: (name: string, value: string | string[]) => void },
    @Headers('origin') origin?: string,
    @Headers('referer') referer?: string,
    @Headers('x-nbos-bff') bffHeader?: string,
  ) {
    assertRefreshCsrf({
      origin,
      referer,
      bffHeader,
      hasBodyToken: Boolean(dto.refreshToken),
    });

    const cookieName = resolveAuthRefreshCookieName();
    const fromCookie = parseCookieHeader(headerValue(req.headers['cookie']))[cookieName];
    const raw = dto.refreshToken ?? fromCookie;
    if (!raw) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const result = await this.authService.refresh(raw, {
      ip: req.ip,
      userAgent: headerValue(req.headers['user-agent']),
    });
    if (result.refreshToken) {
      res.setHeader(
        'Set-Cookie',
        serializeRefreshCookie(buildRefreshCookieOptions(result.refreshToken)),
      );
    }
    return result;
  }

  @Post('accept-invite')
  @Public()
  @Throttle(ACCEPT_INVITE_THROTTLE)
  @ApiOperation({ summary: 'Accept invitation and create account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation' })
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.authService.acceptInvite(dto.token, dto.firstName, dto.lastName, dto.password);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke the current access token / session' })
  @ApiResponse({ status: 200, description: 'Token revoked' })
  async logout(
    @CurrentUser() user: CurrentUserPayload,
    @Res({ passthrough: true })
    res: { setHeader: (name: string, value: string | string[]) => void },
  ) {
    const result = await this.authService.logout(user.jti, user.tokenExp, user.id, user.sessionId);
    res.setHeader('Set-Cookie', serializeRefreshCookie(buildClearRefreshCookieOptions()));
    return result;
  }

  @Post('logout-all')
  @HttpCode(200)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke all AuthSession rows for the current user' })
  async logoutAll(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.logoutAll(user.id);
  }

  @Get('sessions')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List active sessions for the current user' })
  listSessions(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.listSessions(user.id, user.sessionId);
  }

  @Delete('sessions/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke another (or current) session owned by the caller' })
  revokeSession(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.authService.revokeSessionForUser(user.id, id);
  }

  @Get('invite-info')
  @Public()
  @Throttle(INVITE_INFO_THROTTLE)
  @ApiOperation({ summary: 'Get invitation details by token' })
  @ApiResponse({ status: 200, description: 'Invitation email and role name' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invitation' })
  getInviteInfo(@Query('token') token: string) {
    return this.authService.getInvitationInfo(token);
  }
}

function headerValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseCookieHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const out: Record<string, string> = {};
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}
