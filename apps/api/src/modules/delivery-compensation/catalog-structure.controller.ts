import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DELIVERY_COMPENSATION_RULES_MODULE,
  FUNCTION_CATALOG_MODULE,
  type SalePriceTarget,
} from '@nbos/shared';
import { hasCallerPermission } from '../../common/authorization/caller-permission';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { CatalogStructureService } from './catalog-structure.service';
import { FunctionCollectionsService } from './function-collections.service';
import { mapCatalogWriteError } from './map-catalog-write-error';
import { SalePricesService } from './sale-prices.service';

/**
 * Core composition, named collections and sale prices. Reading is open to whoever may browse the
 * catalog, because none of it exposes cost: a core item is a list of work, a collection is a
 * replace-helper kit and a sale price is what the client pays. Writing stays with the Owner.
 */
@ApiTags('delivery-compensation')
@ApiBearerAuth()
@Controller('delivery-catalog')
export class CatalogStructureController {
  constructor(
    private readonly structure: CatalogStructureService,
    private readonly collections: FunctionCollectionsService,
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

  @Get('collections')
  @RequirePermission(FUNCTION_CATALOG_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Named extra-function kits. Apply replaces the deal quote selection.' })
  listCollections(@Query('productType') productType?: string) {
    return this.collections.list(productType);
  }

  @Post('collections')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Create a named extra-function kit for one product kind.' })
  async createCollection(@Body() body: unknown) {
    try {
      return await this.collections.create(body);
    } catch (error) {
      mapCatalogWriteError(error);
    }
  }

  @Put('collections/:id')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Replace a named extra-function kit.' })
  async replaceCollection(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    try {
      return await this.collections.replace(id, body);
    } catch (error) {
      mapCatalogWriteError(error);
    }
  }

  @Delete('collections/:id')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({
    summary:
      'Delete a named extra-function kit. Deal extras stay; the last-applied mark is cleared.',
  })
  async removeCollection(@Param('id', ParseUUIDPipe) id: string) {
    try {
      await this.collections.remove(id);
    } catch (error) {
      mapCatalogWriteError(error);
    }
  }

  @Get('sale-prices')
  @RequirePermission(FUNCTION_CATALOG_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Sale price versions of catalog items.' })
  listSalePrices(@CurrentUser() user: CurrentUserPayload, @Query('targetKey') targetKey?: string) {
    return this.salePrices.list(
      targetKey,
      hasCallerPermission(user.permissions, DELIVERY_COMPENSATION_RULES_MODULE, 'VIEW'),
    );
  }

  @Post('sale-prices')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Create a draft sale price for a function, a gradation or a core.' })
  async createSalePriceDraft(
    @Body()
    body: {
      functionId?: string;
      tierId?: string;
      baseProfileVersionId?: string;
      amountPerUnit?: string | number;
      effectiveFrom?: string;
    },
  ) {
    try {
      return await this.salePrices.createDraft(readSalePriceTarget(body), body);
    } catch (error) {
      mapCatalogWriteError(error);
    }
  }

  @Patch('sale-prices/:id')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update an open draft sale price. Published rows stay frozen.' })
  async updateSalePriceDraft(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    try {
      return await this.salePrices.updateDraft(id, body);
    } catch (error) {
      mapCatalogWriteError(error);
    }
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
