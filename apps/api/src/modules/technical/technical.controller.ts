import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type CurrentUserPayload, RequirePermission } from '../../common/decorators';
import { TechnicalService } from './technical.service';
import type {
  CreateTechnicalAssetDto,
  CreateTechnicalEnvironmentDto,
  RecordTechnicalDeployDto,
  UpdateTechnicalBackupPolicyDto,
  UpdateTechnicalAssetDto,
  UpdateTechnicalEnvironmentDto,
  UpdateTechnicalProfileDto,
} from './technical.types';

@ApiTags('Technical Infrastructure')
@ApiBearerAuth()
@Controller('technical')
export class TechnicalController {
  constructor(private readonly technicalService: TechnicalService) {}

  @Get('products/:productId/profile')
  @RequirePermission('PROJECTS', 'VIEW')
  @ApiOperation({ summary: 'Get product technical profile, assets and environments' })
  getProductProfile(@Param('productId') productId: string) {
    return this.technicalService.getProductProfile(productId);
  }

  @Patch('products/:productId/profile')
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Update product technical profile' })
  updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId') productId: string,
    @Body() body: UpdateTechnicalProfileDto,
  ) {
    return this.technicalService.updateProfile(productId, user.id, body);
  }

  @Post('products/:productId/assets')
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Create product technical asset' })
  createAsset(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId') productId: string,
    @Body() body: CreateTechnicalAssetDto,
  ) {
    return this.technicalService.createAsset(productId, user.id, body);
  }

  @Patch('products/:productId/assets/:assetId')
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Update product technical asset' })
  updateAsset(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId') productId: string,
    @Param('assetId') assetId: string,
    @Body() body: UpdateTechnicalAssetDto,
  ) {
    return this.technicalService.updateAsset(productId, assetId, user.id, body);
  }

  @Post('products/:productId/environments')
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Create product technical environment' })
  createEnvironment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId') productId: string,
    @Body() body: CreateTechnicalEnvironmentDto,
  ) {
    return this.technicalService.createEnvironment(productId, user.id, body);
  }

  @Patch('products/:productId/environments/:environmentId')
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Update product technical environment' })
  updateEnvironment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId') productId: string,
    @Param('environmentId') environmentId: string,
    @Body() body: UpdateTechnicalEnvironmentDto,
  ) {
    return this.technicalService.updateEnvironment(productId, environmentId, user.id, body);
  }

  @Post('products/:productId/deploy-records')
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Record technical deploy event for product' })
  recordDeploy(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId') productId: string,
    @Body() body: RecordTechnicalDeployDto,
  ) {
    return this.technicalService.recordDeploy(productId, user.id, body);
  }

  @Patch('products/:productId/backup-policy')
  @RequirePermission('PROJECTS', 'EDIT')
  @ApiOperation({ summary: 'Update product backup policy summary and status' })
  updateBackupPolicy(
    @CurrentUser() user: CurrentUserPayload,
    @Param('productId') productId: string,
    @Body() body: UpdateTechnicalBackupPolicyDto,
  ) {
    return this.technicalService.updateBackupPolicy(productId, user.id, body);
  }
}
