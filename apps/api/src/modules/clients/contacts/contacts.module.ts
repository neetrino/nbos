import { Module } from '@nestjs/common';
import { AuditModule } from '../../audit/audit.module';
import { GoogleContactsModule } from '../../integrations/google-contacts/google-contacts.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  imports: [AuditModule, GoogleContactsModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
