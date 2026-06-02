import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ProductTeamSyncService } from './product-team-sync.service';
import { ProjectTeamService } from './project-team.service';
import { ProductTeamService } from './product-team.service';
import { PlatformAccessResolverService } from './platform-access-resolver.service';

@Module({
  imports: [AuditModule],
  providers: [
    ProductTeamSyncService,
    ProjectTeamService,
    ProductTeamService,
    PlatformAccessResolverService,
  ],
  exports: [
    ProductTeamSyncService,
    ProjectTeamService,
    ProductTeamService,
    PlatformAccessResolverService,
  ],
})
export class PlatformAccessModule {}
