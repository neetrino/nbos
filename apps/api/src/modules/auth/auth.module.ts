import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthPasswordResetController } from './auth-password-reset.controller';
import { AuthService } from './auth.service';
import { AuthPasswordResetService } from './auth-password-reset.service';
import { AuthSessionService } from './auth-session.service';
import { CredentialVaultSessionModule } from '../credentials/credential-vault-session.module';
import { RequireActiveSessionGuard } from '../../common/guards/require-active-session.guard';
import { TokenDenylistModule } from '../../common/security/token-denylist.module';

@Module({
  imports: [CredentialVaultSessionModule, TokenDenylistModule],
  controllers: [AuthController, AuthPasswordResetController],
  providers: [AuthService, AuthPasswordResetService, AuthSessionService, RequireActiveSessionGuard],
  exports: [AuthService, AuthSessionService, RequireActiveSessionGuard],
})
export class AuthModule {}
