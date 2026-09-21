import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DELIVERY_CONFIGURATION_PERMISSION_MODULE } from '@nbos/shared';
import { CurrentUser, RequirePermission, type CurrentUserPayload } from '../../common/decorators';
import { configurationAccessFromUser } from './delivery-configuration-access';
import { DeliveryConfigurationService } from './delivery-configuration.service';

@ApiTags('Delivery configurations')
@ApiBearerAuth()
@Controller('delivery-configurations')
export class DeliveryConfigurationController {
  constructor(private readonly service: DeliveryConfigurationService) {}

  @Get('by-product/:productId')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Operational configuration or implicit LEGACY. No units.' })
  getByProduct(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.service.getByProduct(productId, configurationAccessFromUser(user, 'VIEW'));
  }

  @Post('by-product/:productId')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Enroll V2 only when Owner readiness switch is on. No BonusEntry.' })
  enrollProduct(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() body: { orderId?: string },
  ) {
    const access = configurationAccessFromUser(user, 'EDIT');
    return this.service.enrollProduct(productId, body.orderId ?? '', access);
  }

  @Get('by-extension/:extensionId')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Operational configuration of an extension or implicit LEGACY.' })
  getByExtension(
    @CurrentUser() user: CurrentUserPayload,
    @Param('extensionId', ParseUUIDPipe) extensionId: string,
  ) {
    return this.service.getByExtension(extensionId, configurationAccessFromUser(user, 'VIEW'));
  }

  @Post('by-extension/:extensionId')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Enroll an extension in V2 under the Owner readiness switch.' })
  enrollExtension(
    @CurrentUser() user: CurrentUserPayload,
    @Param('extensionId', ParseUUIDPipe) extensionId: string,
    @Body() body: { orderId?: string },
  ) {
    const access = configurationAccessFromUser(user, 'EDIT');
    return this.service.enrollExtension(extensionId, body.orderId ?? '', access);
  }

  @Get('by-extension/:extensionId/role-assignments')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Who holds each compensated role on an extension.' })
  listExtensionRoleAssignments(
    @CurrentUser() user: CurrentUserPayload,
    @Param('extensionId', ParseUUIDPipe) extensionId: string,
  ) {
    const access = configurationAccessFromUser(user, 'VIEW');
    return this.service.listExtensionRoleAssignments(extensionId, access);
  }

  @Post('by-extension/:extensionId/role-assignments')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Set extension role holders before the plan is materialized.' })
  setExtensionRoleAssignments(
    @CurrentUser() user: CurrentUserPayload,
    @Param('extensionId', ParseUUIDPipe) extensionId: string,
    @Body() body: { assignments?: Array<{ roleKey?: string; employeeId?: string | null }> },
  ) {
    return this.service.setExtensionRoleAssignments(
      extensionId,
      (body.assignments ?? []).map((row) => ({
        roleKey: row.roleKey ?? '',
        employeeId: row.employeeId ?? null,
      })),
      configurationAccessFromUser(user, 'EDIT'),
    );
  }

  @Put(':id/parameters')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'EDIT')
  @ApiOperation({
    summary: 'Confirm size, base and design mode; freezes the matching base profile.',
  })
  setParameters(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: unknown,
  ) {
    const access = configurationAccessFromUser(user, 'EDIT');
    return this.service.setParameters(id, body, access, user.id);
  }

  @Post(':id/features')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Add an ACTIVE function. Included-in-base stays unpaid.' })
  addFeature(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      functionId?: string;
      expectedRevision?: number;
      reason?: string;
      tierId?: string | null;
    },
  ) {
    return this.service.addFeature(
      id,
      body.functionId ?? '',
      configurationAccessFromUser(user, 'EDIT'),
      {
        expectedRevision: body.expectedRevision,
        actorEmployeeId: user.id,
        reason: body.reason,
        tierId: body.tierId,
      },
    );
  }

  @Delete(':id/features/:featureId')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Archive a feature. Accepted or released amounts stay in the ledger.' })
  removeFeature(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('featureId', ParseUUIDPipe) featureId: string,
    @Query('expectedRevision') expectedRevision?: string,
    @Body()
    body?: {
      expectedRevision?: number;
      reason?: string;
      acceptedAmounts?: Array<{ allocationId?: string; acceptedAmount?: string }>;
    },
  ) {
    const parsedQuery = expectedRevision ? Number(expectedRevision) : undefined;
    const parsedBody = body?.expectedRevision;
    const parsed = parsedBody ?? (Number.isFinite(parsedQuery) ? parsedQuery : undefined);
    const access = configurationAccessFromUser(user, 'EDIT');
    return this.service.removeFeature(id, featureId, access, {
      expectedRevision: parsed,
      reason: body?.reason,
      acceptedAmounts: (body?.acceptedAmounts ?? []).map((row) => ({
        allocationId: row.allocationId ?? '',
        acceptedAmount: row.acceptedAmount ?? '',
      })),
      actorEmployeeId: user.id,
    });
  }

  @Get(':id/replacement-plan')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Components a replacement must redistribute for one role. No money.' })
  getReplacementPlan(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('roleKey') roleKey?: string,
  ) {
    const access = configurationAccessFromUser(user, 'EDIT');
    return this.service.getReplacementPlan(id, (roleKey ?? '') as never, access);
  }

  @Post(':id/replacements')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'EDIT')
  @ApiOperation({
    summary: 'Replace an assignee after plan. Share fields are required and empty by default.',
  })
  replaceEmployee(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    body: {
      roleKey?: string;
      fromEmployeeId?: string;
      toEmployeeId?: string;
      shares?: Array<{ componentId?: string; outgoingPercent?: string; incomingPercent?: string }>;
      reason?: string;
      expectedRevision?: number;
    },
  ) {
    return this.service.replaceEmployee(id, configurationAccessFromUser(user, 'EDIT'), {
      roleKey: body.roleKey as never,
      fromEmployeeId: body.fromEmployeeId ?? '',
      toEmployeeId: body.toEmployeeId ?? '',
      shares: (body.shares ?? []).map((share) => ({
        componentId: share.componentId ?? '',
        outgoingPercent: share.outgoingPercent ?? '',
        incomingPercent: share.incomingPercent ?? '',
      })),
      reason: body.reason ?? '',
      actorEmployeeId: user.id,
      expectedRevision: body.expectedRevision,
    });
  }
}
