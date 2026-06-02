import { Global, Module } from '@nestjs/common';
import { CredentialVaultSessionService } from './credential-vault-session.service';

@Global()
@Module({
  providers: [CredentialVaultSessionService],
  exports: [CredentialVaultSessionService],
})
export class CredentialVaultSessionModule {}
