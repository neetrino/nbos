import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators';
import { AuthPasswordResetService } from './auth-password-reset.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

const FIVE_MINUTES_MS = 5 * 60_000;
const TEN_MINUTES_MS = 10 * 60_000;

const FORGOT_PASSWORD_THROTTLE = { default: { limit: 5, ttl: TEN_MINUTES_MS } } as const;
const RESET_PASSWORD_THROTTLE = { default: { limit: 5, ttl: TEN_MINUTES_MS } } as const;
const RESET_INFO_THROTTLE = { default: { limit: 20, ttl: FIVE_MINUTES_MS } } as const;

@ApiTags('Auth')
@Controller('v1/auth')
export class AuthPasswordResetController {
  constructor(private readonly passwordReset: AuthPasswordResetService) {}

  @Post('forgot-password')
  @Public()
  @HttpCode(200)
  @Throttle(FORGOT_PASSWORD_THROTTLE)
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Generic success; does not reveal whether email exists',
  })
  requestReset(@Body() dto: ForgotPasswordDto) {
    return this.passwordReset.requestReset(dto.email);
  }

  @Get('reset-password-info')
  @Public()
  @Throttle(RESET_INFO_THROTTLE)
  @ApiOperation({ summary: 'Validate a password reset token' })
  @ApiResponse({ status: 200, description: 'Token is valid' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  getResetInfo(@Query('token') token: string) {
    return this.passwordReset.getResetInfo(token ?? '');
  }

  @Post('reset-password')
  @Public()
  @HttpCode(200)
  @Throttle(RESET_PASSWORD_THROTTLE)
  @ApiOperation({ summary: 'Set a new password using a reset token' })
  @ApiResponse({ status: 200, description: 'Password updated; sign in required' })
  @ApiResponse({ status: 400, description: 'Invalid token or weak password' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordReset.resetPassword(dto.token, dto.newPassword);
  }
}
