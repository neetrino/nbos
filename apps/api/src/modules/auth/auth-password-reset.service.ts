import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@nbos/database';
import { PRISMA_TOKEN } from '../../database.module';
import { CredentialVaultSessionService } from '../credentials/credential-vault-session.service';
import {
  completePasswordReset,
  getPasswordResetInfo,
  requestPasswordReset,
} from './auth-password-reset';

@Injectable()
export class AuthPasswordResetService {
  private readonly logger = new Logger(AuthPasswordResetService.name);

  constructor(
    @Inject(PRISMA_TOKEN) private readonly prisma: InstanceType<typeof PrismaClient>,
    private readonly vaultSession: CredentialVaultSessionService,
  ) {}

  /** Public: always returns the same message so emails cannot be enumerated. */
  requestReset(email: string): Promise<{ message: string }> {
    return requestPasswordReset({ prisma: this.prisma, logger: this.logger, email });
  }

  getResetInfo(token: string): Promise<{ email: string }> {
    return getPasswordResetInfo({ prisma: this.prisma, token });
  }

  resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ success: true; requiresReauth: true }> {
    return completePasswordReset({
      prisma: this.prisma,
      vaultSession: this.vaultSession,
      logger: this.logger,
      token,
      newPassword,
    });
  }
}
