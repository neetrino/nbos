import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DELIVERY_COMPENSATION_RULES_MODULE,
  parseBaseProfilePatchBody,
  parseBaseProfileWriteBody,
  parseFunctionPricePatchBody,
  parseFunctionPriceWriteBody,
  parseRoleRatePatchBody,
  parseRoleRateWriteBody,
} from '@nbos/shared';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { DeliveryCompensationRulesPublishService } from './delivery-compensation-rules-publish.service';
import { DeliveryCompensationRulesService } from './delivery-compensation-rules.service';
import { mapCatalogWriteError } from './map-catalog-write-error';

@ApiTags('Delivery compensation rules')
@ApiBearerAuth()
@Controller('delivery-compensation/rules')
export class DeliveryCompensationRulesController {
  constructor(
    private readonly service: DeliveryCompensationRulesService,
    private readonly publishService: DeliveryCompensationRulesPublishService,
  ) {}

  @Get('enrollment')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Owner readiness switch for enrolling new deliveries in V2' })
  getEnrollment() {
    return this.service.getEnrollmentSetting();
  }

  @Post('enrollment')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Turn V2 enrollment for new deliveries on or off' })
  setEnrollment(@Body() body: { enabled?: boolean }) {
    return this.service.setEnrollmentSetting(body.enabled === true);
  }

  @Get('function-prices')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Owner/CEO function unit vectors' })
  listFunctionPrices() {
    return this.service.listFunctionPrices();
  }

  @Get('base-profiles')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Owner/CEO base profile versions' })
  listBaseProfiles() {
    return this.service.listBaseProfiles();
  }

  @Get('role-rates')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Owner/CEO same-role rates' })
  listRoleRates() {
    return this.service.listRoleRates();
  }

  @Post('role-rates')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'ADD')
  @ApiOperation({ summary: 'Create a draft same-role rate. No employee-specific rates.' })
  createRoleRate(@Body() body: unknown) {
    try {
      return this.service.createRoleRateDraft(parseRoleRateWriteBody(body));
    } catch (error) {
      mapCatalogWriteError(error);
    }
  }

  @Patch('role-rates/:id')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update an open draft same-role rate. Published rows stay frozen.' })
  updateRoleRate(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    try {
      return this.service.updateRoleRateDraft(id, parseRoleRatePatchBody(body));
    } catch (error) {
      mapCatalogWriteError(error);
    }
  }

  @Post('function-prices')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'ADD')
  @ApiOperation({ summary: 'Create a draft unit vector for a catalog function' })
  async createFunctionPrice(@Body() body: unknown) {
    try {
      return await this.service.createFunctionPriceDraft(parseFunctionPriceWriteBody(body));
    } catch (error) {
      mapCatalogWriteError(error);
    }
  }

  @Patch('function-prices/:id')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({
    summary: 'Update an open draft function unit vector. Published rows stay frozen.',
  })
  async updateFunctionPrice(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    try {
      return await this.service.updateFunctionPriceDraft(id, parseFunctionPricePatchBody(body));
    } catch (error) {
      mapCatalogWriteError(error);
    }
  }

  @Post('base-profiles')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'ADD')
  @ApiOperation({
    summary: 'Save the draft core for one product kind. Reuses the open draft and profile key.',
  })
  async createBaseProfile(@Body() body: unknown) {
    try {
      return await this.service.createBaseProfileDraft(parseBaseProfileWriteBody(body));
    } catch (error) {
      mapCatalogWriteError(error);
    }
  }

  @Patch('base-profiles/:id')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Update the open draft core. Published rows stay frozen.' })
  async updateBaseProfile(@Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    try {
      return await this.service.updateBaseProfileDraft(id, parseBaseProfilePatchBody(body));
    } catch (error) {
      mapCatalogWriteError(error);
    }
  }

  @Post('role-rates/:id/publish')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Publish a role rate and archive the previous published version' })
  publishRoleRate(@CurrentUser() user: CurrentUserPayload, @Param('id', ParseUUIDPipe) id: string) {
    return this.publishService.publishRoleRate(id, user.id);
  }

  @Post('function-prices/:id/publish')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Publish a complete function unit vector' })
  publishFunctionPrice(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body?: { confirmZeroUnits?: boolean },
  ) {
    return this.publishService.publishFunctionPrice(id, user.id, Boolean(body?.confirmZeroUnits));
  }

  @Post('base-profiles/:id/publish')
  @RequirePermission(DELIVERY_COMPENSATION_RULES_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Publish a complete base profile' })
  publishBaseProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body?: { confirmZeroUnits?: boolean },
  ) {
    return this.publishService.publishBaseProfile(id, user.id, Boolean(body?.confirmZeroUnits));
  }
}
