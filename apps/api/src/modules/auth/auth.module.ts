import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';
import { CredentialVaultSessionModule } from '../credentials/credential-vault-session.module';
import { RequireActiveSessionGuard } from '../../common/guards/require-active-session.guard';

@Module({
  imports: [CredentialVaultSessionModule],
  controllers: [AuthController],
  providers: [AuthService, AuthSessionService, RequireActiveSessionGuard],
  exports: [AuthService, AuthSessionService, RequireActiveSessionGuard],
})
export class AuthModule {}
