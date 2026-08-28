import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { ArmeniaCompanyLookupClient } from './armenia-lookup/armenia-company-lookup.client';
import { ArmeniaCompanyLookupService } from './armenia-lookup/armenia-company-lookup.service';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';

@Module({
  imports: [AuditModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, ArmeniaCompanyLookupClient, ArmeniaCompanyLookupService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
