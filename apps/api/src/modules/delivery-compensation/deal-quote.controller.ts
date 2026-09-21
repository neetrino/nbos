import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CRM_DEALS_MODULE } from '@nbos/shared';
import { RequirePermission } from '../../common/decorators';
import { DealQuoteService } from './deal-quote.service';
import { mapCatalogWriteError } from './map-catalog-write-error';

@ApiTags('delivery-compensation')
@ApiBearerAuth()
@Controller('delivery-catalog/deals')
export class DealQuoteController {
  constructor(private readonly quotes: DealQuoteService) {}

  @Get(':dealId/quote')
  @RequirePermission(CRM_DEALS_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Draft function composition on a deal. Not a price write.' })
  get(@Param('dealId', ParseUUIDPipe) dealId: string) {
    return this.quotes.get(dealId);
  }

  @Put(':dealId/quote')
  @RequirePermission(CRM_DEALS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Replace the deal quote extras by hand.' })
  async replace(@Param('dealId', ParseUUIDPipe) dealId: string, @Body() body: unknown) {
    try {
      return await this.quotes.replace(dealId, body);
    } catch (error) {
      mapCatalogWriteError(error);
    }
  }

  @Post(':dealId/quote/apply-collection')
  @RequirePermission(CRM_DEALS_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Replace the quote extras with one named collection.' })
  async applyCollection(@Param('dealId', ParseUUIDPipe) dealId: string, @Body() body: unknown) {
    try {
      return await this.quotes.applyCollection(dealId, body);
    } catch (error) {
      mapCatalogWriteError(error);
    }
  }
}
