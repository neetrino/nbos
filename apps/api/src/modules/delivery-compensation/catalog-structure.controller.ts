import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DELIVERY_COMPENSATION_RULES_MODULE,
  FUNCTION_CATALOG_MODULE,
  type SalePriceTarget,
} from '@nbos/shared';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { CatalogStructureService } from './catalog-structure.service';
import { SalePricesService } from './sale-prices.service';

/**
 * Core composition, size presets and sale prices. Reading is open to whoever may browse the catalog,
 * because none of it exposes cost: a core item is a list of work, a preset is a list of modules and a
 * sale price is what the client pays. Writing stays with the Owner, like every other norm.
 */
@ApiTags('delivery-compensation')
@ApiBearerAuth()
@Controller('delivery-catalog')
export class CatalogStructureController {
  constructor(
    private readonly structure: CatalogStructureService,
    private readonly salePrices: SalePricesService,
  ) {}

  @Get('base-profiles/:id/core-items')
  @RequirePermission(FUNCTION_CATALOG_MODULE, 'VIEW')
  @ApiOperation({ summary: 'What the indivisible product core contains. No units.' })
  listCoreItems(@Param('id', ParseUUIDPipe) id: string) {
    return this.structure.listCoreItems(id);
  }

  @Put('base-profiles/:id/core-items')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Replace the core composition of a draft base profile version.' })
  replaceCoreItems(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.structure.replaceCoreItems(id, body);
  }

  @Get('size-presets')
  @RequirePermission(FUNCTION_CATALOG_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Modules pre-checked per size. Charged as normal extras.' })
  listSizePresets(@Query('profileKey') profileKey?: string) {
    return this.structure.listSizePresets(profileKey ?? '');
  }

  @Put('size-presets')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Replace one size level of one profile. An empty list clears it.' })
  replaceSizePreset(@Body() body: unknown) {
    return this.structure.replaceSizePreset(body);
  }

  @Get('sale-prices')
  @RequirePermission(FUNCTION_CATALOG_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Sale price versions of catalog items.' })
  listSalePrices(@Query('targetKey') targetKey?: string) {
    return this.salePrices.list(targetKey);
  }

  @Post('sale-prices')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Create a draft sale price for a function, a gradation or a core.' })
  createSalePriceDraft(
    @Body()
    body: {
      functionId?: string;
      tierId?: string;
      baseProfileVersionId?: string;
      multiplier?: string | number;
      fixedAmount?: string | number;
      effectiveFrom?: string;
    },
  ) {
    return this.salePrices.createDraft(readSalePriceTarget(body), body);
  }

  @Post('sale-prices/:id/publish')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Publish a draft sale price, superseding the previous one.' })
  publishSalePrice(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.salePrices.publish(id, user.id);
  }

  @Get('sale-prices/default-multiplier')
  @RequirePermission(FUNCTION_CATALOG_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Multiplier applied when a card carries no price of its own.' })
  async getDefaultMultiplier() {
    return { defaultSaleMultiplier: await this.salePrices.defaultMultiplier() };
  }

  @Post('sale-prices/default-multiplier')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Set the global sale multiplier.' })
  setDefaultMultiplier(@Body() body: { multiplier?: string | number }) {
    return this.salePrices.setDefaultMultiplier(body.multiplier);
  }
}

function readSalePriceTarget(body: {
  functionId?: string;
  tierId?: string;
  baseProfileVersionId?: string;
}): SalePriceTarget {
  if (body.tierId) return { kind: 'TIER', tierId: body.tierId };
  if (body.baseProfileVersionId) {
    return { kind: 'CORE', baseProfileVersionId: body.baseProfileVersionId };
  }
  return { kind: 'FUNCTION', functionId: body.functionId ?? '' };
}
