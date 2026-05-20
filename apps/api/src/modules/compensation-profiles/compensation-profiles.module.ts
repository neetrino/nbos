import { Module } from '@nestjs/common';
import { CompensationProfilesController } from './compensation-profiles.controller';
import { CompensationProfilesService } from './compensation-profiles.service';

@Module({
  controllers: [CompensationProfilesController],
  providers: [CompensationProfilesService],
  exports: [CompensationProfilesService],
})
export class CompensationProfilesModule {}
