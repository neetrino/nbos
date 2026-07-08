import { Module } from '@nestjs/common';
import { MetaModule } from './meta/meta.module';

@Module({
  imports: [MetaModule],
})
export class IntegrationsModule {}
