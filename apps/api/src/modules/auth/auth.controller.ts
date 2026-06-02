import { Controller, Post, Get, Body, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AcceptInviteDto } from './dto/accept-invite.dto';
import { Public, CurrentUser, type CurrentUserPayload } from '../../common/decorators';

const ONE_MINUTE_MS = 60_000;
const FIVE_MINUTES_MS = 5 * ONE_MINUTE_MS;
const TEN_MINUTES_MS = 10 * ONE_MINUTE_MS;

/** Anti-brute-force / anti-enumeration limits per IP (tighter than the global 100/min). */
const LOGIN_THROTTLE = { default: { limit: 10, ttl: ONE_MINUTE_MS } } as const;
const ACCEPT_INVITE_THROTTLE = { default: { limit: 5, ttl: TEN_MINUTES_MS } } as const;
const INVITE_INFO_THROTTLE = { default: { limit: 20, ttl: FIVE_MINUTES_MS } } as const;

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
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
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
  @ApiOperation({ summary: 'Revoke the current access token' })
  @ApiResponse({ status: 200, description: 'Token revoked' })
  logout(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.logout(user.jti, user.tokenExp, user.id);
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
