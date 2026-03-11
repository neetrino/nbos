import { Module } from '@nestjs/common';
import { ContactsModule } from './contacts/contacts.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [ContactsModule, CompaniesModule],
})
export class ClientsModule {}
