import { MODULE_METADATA } from '@nestjs/common/constants';
import { TokenDenylistModule } from '../../common/security/token-denylist.module';
import { AuthModule } from './auth.module';

describe('AuthModule', () => {
  it('declares its token denylist dependency explicitly', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AuthModule) as unknown[];

    expect(imports).toContain(TokenDenylistModule);
  });
});
