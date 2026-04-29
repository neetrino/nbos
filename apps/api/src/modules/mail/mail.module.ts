import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MailAccountCommandService } from './mail-account-command.service';
import { MailController } from './mail.controller';
import { MailService } from './mail.service';
import { MailThreadCommandService } from './mail-thread-command.service';

@Module({
  imports: [AuditModule],
  controllers: [MailController],
  providers: [MailService, MailThreadCommandService, MailAccountCommandService],
  exports: [MailService],
})
export class MailModule {}
