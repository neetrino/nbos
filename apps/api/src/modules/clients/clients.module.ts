import { Module } from '@nestjs/common';
import { ContactsModule } from './contacts/contacts.module';
import { CompaniesModule } from './companies/companies.module';
import { PortfolioModule } from './portfolio/portfolio.module';

@Module({
  imports: [ContactsModule, CompaniesModule, PortfolioModule],
})
export class ClientsModule {}
