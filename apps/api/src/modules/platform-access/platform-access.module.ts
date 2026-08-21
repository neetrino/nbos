import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { PlatformOwnershipModule } from '../platform-ownership/platform-ownership.module';
import { AccessPoliciesController } from './access-policies.controller';
import { ProductTeamSyncService } from './product-team-sync.service';
import { ProjectTeamService } from './project-team.service';
import { ProductTeamService } from './product-team.service';
import { PlatformAccessResolverService } from './platform-access-resolver.service';
import { RoleAccessPolicyService } from './role-access-policy.service';
import { EmployeeAccessOverrideService } from './employee-access-override.service';

/** Worker/scheduler import this module without AppModule; ownership must live here. */
@Module({
  imports: [AuditModule, PlatformOwnershipModule],
  controllers: [AccessPoliciesController],
  providers: [
    ProductTeamSyncService,
    ProjectTeamService,
    ProductTeamService,
    PlatformAccessResolverService,
    RoleAccessPolicyService,
    EmployeeAccessOverrideService,
  ],
  exports: [
    ProductTeamSyncService,
    ProjectTeamService,
    ProductTeamService,
    PlatformAccessResolverService,
    RoleAccessPolicyService,
    EmployeeAccessOverrideService,
  ],
})
export class PlatformAccessModule {}
