import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DELIVERY_CONFIGURATION_PERMISSION_MODULE } from '@nbos/shared';
import { CurrentUser, RequirePermission, type CurrentUserPayload } from '../../common/decorators';
import { DeliveryConfigurationService } from './delivery-configuration.service';

@ApiTags('Delivery configurations')
@ApiBearerAuth()
@Controller('delivery-configurations')
export class DeliveryConfigurationController {
  constructor(private readonly service: DeliveryConfigurationService) {}

  @Get('by-product/:productId')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Operational configuration or implicit LEGACY. No units.' })
  getByProduct(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.service.getByProduct(productId);
  }

  @Post('by-product/:productId')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Enroll V2 only when Owner readiness switch is on. No BonusEntry.' })
  enrollProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() body: { orderId?: string },
  ) {
    return this.service.enrollProduct(productId, body.orderId ?? '');
  }

  @Get('by-extension/:extensionId')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Operational configuration of an extension or implicit LEGACY.' })
  getByExtension(@Param('extensionId', ParseUUIDPipe) extensionId: string) {
    return this.service.getByExtension(extensionId);
  }

  @Post('by-extension/:extensionId')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Enroll an extension in V2 under the Owner readiness switch.' })
  enrollExtension(
    @Param('extensionId', ParseUUIDPipe) extensionId: string,
    @Body() body: { orderId?: string },
  ) {
    return this.service.enrollExtension(extensionId, body.orderId ?? '');
  }

  @Get('by-extension/:extensionId/role-assignments')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'VIEW')
  @ApiOperation({ summary: 'Who holds each compensated role on an extension.' })
  listExtensionRoleAssignments(@Param('extensionId', ParseUUIDPipe) extensionId: string) {
    return this.service.listExtensionRoleAssignments(extensionId);
  }

  @Post('by-extension/:extensionId/role-assignments')
  @RequirePermission(DELIVERY_CONFIGURATION_PERMISSION_MODULE, 'EDIT')
  @ApiOperation({ summary: 'Set extension role holders before the plan is materialized.' })
  setExtensionRoleAssignments(
    @Param('extensionId', ParseUUIDPipe) extensionId: string,
    @Body() body: { assignments?: Array<{ roleKey?: string; employeeId?: string | null }> },
  ) {
    return this.service.setExtensionRoleAssignments(
      extensionId,
      (body.assignments ?? []).map((row) => ({
        roleKey: row.roleKey ?? '',
        employeeId: row.employeeId ?? null,
      })),
    );
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
    return this.service.addFeature(id, body.functionId ?? '', {
      expectedRevision: body.expectedRevision,
      actorEmployeeId: user.id,
      reason: body.reason,
      tierId: body.tierId,
    });
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
    return this.service.removeFeature(id, featureId, {
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
  getReplacementPlan(@Param('id', ParseUUIDPipe) id: string, @Query('roleKey') roleKey?: string) {
    return this.service.getReplacementPlan(id, (roleKey ?? '') as never);
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
    return this.service.replaceEmployee(id, {
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
