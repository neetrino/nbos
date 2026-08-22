import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { AI_EVALUATION_GRADING_KINDS } from '@nbos/shared';
import {
  CurrentUser,
  type CurrentUserPayload,
  RequirePermission,
} from '../../../common/decorators';
import { AGENT_DESCRIPTION_MAX_LENGTH, AGENT_NAME_MAX_LENGTH } from '../ai-platform.constants';
import { AiEvaluationService } from '../evaluation/ai-evaluation.service';
import {
  AI_ADMIN_PERMISSION_ACTION,
  AI_ADMIN_PERMISSION_MODULE,
  AI_ADMIN_ROUTE_PREFIX,
} from './ai-admin.constants';

class CreateEvaluationSuiteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(AGENT_NAME_MAX_LENGTH)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(AGENT_DESCRIPTION_MAX_LENGTH)
  purpose?: string | null;

  @IsOptional()
  @IsString()
  domainModule?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @IsIn(AI_EVALUATION_GRADING_KINDS, { each: true })
  gradingKinds!: Array<(typeof AI_EVALUATION_GRADING_KINDS)[number]>;
}

class CreateEvaluationDatasetDto {
  @IsString()
  @MinLength(1)
  @MaxLength(AGENT_NAME_MAX_LENGTH)
  name!: string;

  @IsString()
  @MinLength(1)
  identityKey!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  version!: number;
}

class CreateEvaluationRunDto {
  @IsString()
  datasetId!: string;

  @IsIn(AI_EVALUATION_GRADING_KINDS)
  gradingKind!: (typeof AI_EVALUATION_GRADING_KINDS)[number];

  @IsOptional()
  @IsString()
  modelId?: string | null;

  @IsOptional()
  @IsString()
  modelPolicyId?: string | null;

  @IsOptional()
  @IsString()
  promptVersionId?: string | null;
}

class CompleteEvaluationRunDto {
  @IsOptional()
  @IsString()
  qualityScore?: string | null;

  @IsOptional()
  @Type(() => Number)
  latencyMsAvg?: number | null;

  @IsOptional()
  @IsString()
  estimatedCost?: string | null;

  @IsOptional()
  @IsString()
  currency?: string | null;

  @IsOptional()
  @Type(() => Number)
  sampleCount?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(AGENT_DESCRIPTION_MAX_LENGTH)
  notes?: string | null;
}

@ApiTags('AI Admin')
@ApiBearerAuth()
@RequirePermission(AI_ADMIN_PERMISSION_MODULE, AI_ADMIN_PERMISSION_ACTION)
@Controller(`${AI_ADMIN_ROUTE_PREFIX}/evaluation`)
export class AiAdminEvaluationController {
  constructor(private readonly evaluation: AiEvaluationService) {}

  @Get('suites')
  @ApiOperation({ summary: 'List evaluation suites' })
  listSuites() {
    return this.evaluation.listSuites();
  }

  @Post('suites')
  @ApiOperation({ summary: 'Create an evaluation suite' })
  createSuite(@CurrentUser() user: CurrentUserPayload, @Body() body: CreateEvaluationSuiteDto) {
    return this.evaluation.createSuite(body, user.id);
  }

  @Post('suites/:suiteId/datasets')
  @ApiOperation({ summary: 'Add a versioned evaluation dataset' })
  addDataset(
    @CurrentUser() user: CurrentUserPayload,
    @Param('suiteId') suiteId: string,
    @Body() body: CreateEvaluationDatasetDto,
  ) {
    return this.evaluation.addDataset(suiteId, body, user.id);
  }

  @Get('suites/:suiteId/runs')
  @ApiOperation({ summary: 'List evaluation runs for a suite' })
  listRuns(@Param('suiteId') suiteId: string) {
    return this.evaluation.listRuns(suiteId);
  }

  @Post('suites/:suiteId/runs')
  @ApiOperation({ summary: 'Create an evaluation run for one grading kind' })
  createRun(
    @CurrentUser() user: CurrentUserPayload,
    @Param('suiteId') suiteId: string,
    @Body() body: CreateEvaluationRunDto,
  ) {
    return this.evaluation.createRun(suiteId, body, user.id);
  }

  @Post('runs/:runId/start')
  @ApiOperation({ summary: 'Mark an evaluation run as running' })
  startRun(@Param('runId') runId: string) {
    return this.evaluation.startRun(runId);
  }

  @Post('runs/:runId/complete')
  @ApiOperation({ summary: 'Store aggregate evaluation results without activating a model' })
  completeRun(@Param('runId') runId: string, @Body() body: CompleteEvaluationRunDto) {
    return this.evaluation.completeRun(runId, body);
  }
}
