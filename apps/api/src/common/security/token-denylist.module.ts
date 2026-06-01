import { Global, Module } from '@nestjs/common';
import { TokenDenylistService } from './token-denylist.service';

/**
 * Global so the singleton instance is shared between the globally-registered
 * AuthGuard (checks revocation) and AuthService (revokes on logout).
 */
@Global()
@Module({
  providers: [TokenDenylistService],
  exports: [TokenDenylistService],
})
export class TokenDenylistModule {}
