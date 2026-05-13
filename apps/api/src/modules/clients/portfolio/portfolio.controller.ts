import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload } from '../../../common/decorators';
import { PortfolioService } from './portfolio.service';

@ApiTags('Clients / Portfolio')
@ApiBearerAuth()
@Controller('clients/portfolio')
export class PortfolioController {
  constructor(private readonly portfolioService: PortfolioService) {}

  @Get('contact/:contactId')
  @ApiOperation({ summary: 'Computed client portfolio for a contact' })
  async contactPortfolio(
    @Param('contactId') contactId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.portfolioService.getContactPortfolio(contactId, user);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Computed client portfolio for a company' })
  async companyPortfolio(
    @Param('companyId') companyId: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.portfolioService.getCompanyPortfolio(companyId, user);
  }
}
