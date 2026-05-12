import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';

@ApiTags('Clients / Portfolio')
@ApiBearerAuth()
@Controller('clients/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('contact/:contactId')
  @ApiOperation({ summary: 'Computed client portfolio for a contact' })
  async contactPortfolio(@Param('contactId') contactId: string) {
    return this.portfolioService.getContactPortfolio(contactId);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Computed client portfolio for a company' })
  async companyPortfolio(@Param('companyId') companyId: string) {
    return this.portfolioService.getCompanyPortfolio(companyId);
  }
}
