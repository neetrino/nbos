import { Controller, HttpCode, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  RequireActiveSession,
  RequirePermission,
  type CurrentUserPayload,
} from '../../common/decorators';
import { EmployeeSecurityAdminService } from './employee-security-admin.service';
import type {
  EmployeePasswordResetLinkResult,
  EmployeeSessionRevokeResult,
} from './employee-security-admin.types';

/** Same window as the public forgot-password route (`auth-password-reset.controller.ts`). */
const SECURITY_ACTION_THROTTLE = { default: { limit: 5, ttl: 10 * 60_000 } } as const;

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeeSecurityAdminController {
  constructor(private readonly security: EmployeeSecurityAdminService) {}

  @Post(':id/security/password-reset-link')
  @HttpCode(200)
  @RequirePermission('COMPANY', 'EDIT')
  @RequireActiveSession()
  @Throttle(SECURITY_ACTION_THROTTLE)
  @ApiOperation({ summary: 'Owner-initiated password reset email for an employee' })
  @ApiResponse({ status: 200, description: 'Reset link mailed to the employee' })
  @ApiResponse({ status: 403, description: 'Platform owner identity required' })
  sendPasswordResetLink(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<EmployeePasswordResetLinkResult> {
    return this.security.sendPasswordResetLink(user.id, id);
  }

  @Post(':id/security/revoke-sessions')
  @HttpCode(200)
  @RequirePermission('COMPANY', 'EDIT')
  @RequireActiveSession()
  @Throttle(SECURITY_ACTION_THROTTLE)
  @ApiOperation({ summary: 'Owner-initiated sign-out of all employee sessions' })
  @ApiResponse({ status: 200, description: 'Active sessions revoked and vault locked' })
  @ApiResponse({ status: 403, description: 'Platform owner identity required' })
  revokeSessions(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<EmployeeSessionRevokeResult> {
    return this.security.revokeAllSessions(user.id, id);
  }
}
