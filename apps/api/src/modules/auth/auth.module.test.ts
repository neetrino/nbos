import { MODULE_METADATA } from '@nestjs/common/constants';
import { CredentialVaultSessionModule } from '../credentials/credential-vault-session.module';
import { AuthModule } from './auth.module';

describe('AuthModule', () => {
  it('imports the credential vault session module', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, AuthModule) as unknown[];
    expect(imports).toContain(CredentialVaultSessionModule);
  });
});
