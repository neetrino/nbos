import { MODULE_METADATA } from '@nestjs/common/constants';
import { PlatformOwnershipModule } from '../platform-ownership/platform-ownership.module';
import { PlatformAccessModule } from './platform-access.module';

describe('PlatformAccessModule', () => {
  it('imports PlatformOwnershipModule so worker and scheduler graphs resolve ownership', () => {
    const imports = Reflect.getMetadata(MODULE_METADATA.IMPORTS, PlatformAccessModule) as unknown[];
    expect(imports).toContain(PlatformOwnershipModule);
  });
});
