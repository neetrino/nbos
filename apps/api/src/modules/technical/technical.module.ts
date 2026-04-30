import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { TechnicalController } from './technical.controller';
import { TechnicalService } from './technical.service';

@Module({
  imports: [AuditModule],
  controllers: [TechnicalController],
  providers: [TechnicalService],
  exports: [TechnicalService],
})
export class TechnicalModule {}
