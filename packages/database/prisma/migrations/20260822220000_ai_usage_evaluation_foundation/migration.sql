-- AI Platform Phase 1 Chat 11: usage/cost/evaluation foundation.
-- Additive: new enums + empty tables + nullable-safe default column on ai_models.
-- No backfill rewrite of existing rows beyond the new column default.
-- Indexes are transactional CREATE INDEX: the new tables are empty.
--
-- Risk: LOW. Not applied to production in this chat.

CREATE TYPE "AiModelEvaluationStatusEnum" AS ENUM (
  'NOT_EVALUATED',
  'PENDING',
  'EVALUATED',
  'UNSUITABLE'
);

ALTER TABLE "ai_models"
  ADD COLUMN "evaluation_status" "AiModelEvaluationStatusEnum" NOT NULL DEFAULT 'NOT_EVALUATED';

CREATE TYPE "AiExecutionKindEnum" AS ENUM (
  'CAPABILITY',
  'MODEL_INVOCATION'
);

CREATE TYPE "AiExecutionStatusEnum" AS ENUM (
  'STARTED',
  'SUCCEEDED',
  'FAILED',
  'RATE_LIMITED',
  'CANCELLED'
);

CREATE TYPE "AiBudgetScopeTypeEnum" AS ENUM (
  'ORGANIZATION',
  'PROVIDER',
  'INTERNAL_AGENT',
  'MODEL_POLICY',
  'DOMAIN'
);

CREATE TYPE "AiBudgetPeriodEnum" AS ENUM (
  'DAILY',
  'MONTHLY'
);

CREATE TYPE "AiBudgetMetricEnum" AS ENUM (
  'EXECUTION_COUNT',
  'ESTIMATED_COST',
  'INPUT_UNITS'
);

CREATE TYPE "AiBudgetBehaviorEnum" AS ENUM (
  'ALERT_ONLY',
  'THROTTLE',
  'DISABLE_EXPENSIVE_TIER',
  'REQUIRE_APPROVAL',
  'HARD_STOP'
);

CREATE TYPE "AiEvaluationSuiteStatusEnum" AS ENUM (
  'DRAFT',
  'ACTIVE',
  'RETIRED'
);

CREATE TYPE "AiEvaluationRunStatusEnum" AS ENUM (
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELLED'
);

CREATE TYPE "AiEvaluationGradingKindEnum" AS ENUM (
  'DETERMINISTIC',
  'HUMAN',
  'MODEL_BASED'
);

CREATE TABLE "ai_executions" (
    "id" TEXT NOT NULL,
    "kind" "AiExecutionKindEnum" NOT NULL,
    "status" "AiExecutionStatusEnum" NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "on_behalf_of_actor_type" TEXT,
    "on_behalf_of_actor_id" TEXT,
    "external_agent_id" TEXT,
    "internal_agent_id" TEXT,
    "provider_connection_id" TEXT,
    "model_id" TEXT,
    "model_policy_id" TEXT,
    "model_policy_version" INTEGER,
    "prompt_policy_id" TEXT,
    "prompt_version_id" TEXT,
    "capability_key" TEXT,
    "domain_module" TEXT,
    "channel" TEXT,
    "correlation_id" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "fallback_occurred" BOOLEAN NOT NULL DEFAULT false,
    "fallback_reason" TEXT,
    "selected_primary_model_id" TEXT,
    "selected_fallback_model_id" TEXT,
    "latency_ms" INTEGER,
    "error_code" TEXT,
    "input_units" INTEGER,
    "output_units" INTEGER,
    "cached_units" INTEGER,
    "reasoning_units" INTEGER,
    "other_units" INTEGER,
    "provider_reported_cost" DECIMAL(18,6),
    "estimated_cost" DECIMAL(18,6),
    "currency" TEXT,
    "pricing_version" TEXT,
    "pricing_effective_on" TIMESTAMP(3),
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_executions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_executions_actor_type_actor_id_started_at_idx"
  ON "ai_executions"("actor_type", "actor_id", "started_at");
CREATE INDEX "ai_executions_internal_agent_id_started_at_idx"
  ON "ai_executions"("internal_agent_id", "started_at");
CREATE INDEX "ai_executions_provider_connection_id_started_at_idx"
  ON "ai_executions"("provider_connection_id", "started_at");
CREATE INDEX "ai_executions_model_id_started_at_idx"
  ON "ai_executions"("model_id", "started_at");
CREATE INDEX "ai_executions_model_policy_id_started_at_idx"
  ON "ai_executions"("model_policy_id", "started_at");
CREATE INDEX "ai_executions_capability_key_started_at_idx"
  ON "ai_executions"("capability_key", "started_at");
CREATE INDEX "ai_executions_correlation_id_idx"
  ON "ai_executions"("correlation_id");
CREATE INDEX "ai_executions_status_started_at_idx"
  ON "ai_executions"("status", "started_at");

CREATE TABLE "ai_budget_limits" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope_type" "AiBudgetScopeTypeEnum" NOT NULL,
    "scope_id" TEXT NOT NULL,
    "metric" "AiBudgetMetricEnum" NOT NULL,
    "period" "AiBudgetPeriodEnum" NOT NULL,
    "ceiling" DECIMAL(18,6) NOT NULL,
    "currency" TEXT,
    "behavior" "AiBudgetBehaviorEnum" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_budget_limits_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_budget_limits_scope_type_scope_id_metric_period_key"
  ON "ai_budget_limits"("scope_type", "scope_id", "metric", "period");
CREATE INDEX "ai_budget_limits_created_by_id_idx"
  ON "ai_budget_limits"("created_by_id");

ALTER TABLE "ai_budget_limits"
  ADD CONSTRAINT "ai_budget_limits_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ai_evaluation_suites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "purpose" TEXT,
    "status" "AiEvaluationSuiteStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "domain_module" TEXT,
    "grading_kinds" "AiEvaluationGradingKindEnum"[] NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_evaluation_suites_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_evaluation_suites_status_idx"
  ON "ai_evaluation_suites"("status");
CREATE INDEX "ai_evaluation_suites_created_by_id_idx"
  ON "ai_evaluation_suites"("created_by_id");

ALTER TABLE "ai_evaluation_suites"
  ADD CONSTRAINT "ai_evaluation_suites_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ai_evaluation_datasets" (
    "id" TEXT NOT NULL,
    "suite_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "identity_key" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_evaluation_datasets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_evaluation_datasets_suite_id_identity_key_version_key"
  ON "ai_evaluation_datasets"("suite_id", "identity_key", "version");
CREATE INDEX "ai_evaluation_datasets_created_by_id_idx"
  ON "ai_evaluation_datasets"("created_by_id");

ALTER TABLE "ai_evaluation_datasets"
  ADD CONSTRAINT "ai_evaluation_datasets_suite_id_fkey"
  FOREIGN KEY ("suite_id") REFERENCES "ai_evaluation_suites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_evaluation_datasets"
  ADD CONSTRAINT "ai_evaluation_datasets_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ai_evaluation_runs" (
    "id" TEXT NOT NULL,
    "suite_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "model_id" TEXT,
    "model_policy_id" TEXT,
    "prompt_version_id" TEXT,
    "status" "AiEvaluationRunStatusEnum" NOT NULL DEFAULT 'PENDING',
    "grading_kind" "AiEvaluationGradingKindEnum" NOT NULL,
    "quality_score" DECIMAL(8,4),
    "latency_ms_avg" INTEGER,
    "estimated_cost" DECIMAL(18,6),
    "currency" TEXT,
    "sample_count" INTEGER,
    "reviewer_employee_id" TEXT,
    "notes" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_evaluation_runs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ai_evaluation_runs_suite_id_status_idx"
  ON "ai_evaluation_runs"("suite_id", "status");
CREATE INDEX "ai_evaluation_runs_model_id_idx"
  ON "ai_evaluation_runs"("model_id");
CREATE INDEX "ai_evaluation_runs_model_policy_id_idx"
  ON "ai_evaluation_runs"("model_policy_id");
CREATE INDEX "ai_evaluation_runs_prompt_version_id_idx"
  ON "ai_evaluation_runs"("prompt_version_id");
CREATE INDEX "ai_evaluation_runs_created_by_id_idx"
  ON "ai_evaluation_runs"("created_by_id");
CREATE INDEX "ai_evaluation_runs_reviewer_employee_id_idx"
  ON "ai_evaluation_runs"("reviewer_employee_id");

ALTER TABLE "ai_evaluation_runs"
  ADD CONSTRAINT "ai_evaluation_runs_suite_id_fkey"
  FOREIGN KEY ("suite_id") REFERENCES "ai_evaluation_suites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_evaluation_runs"
  ADD CONSTRAINT "ai_evaluation_runs_dataset_id_fkey"
  FOREIGN KEY ("dataset_id") REFERENCES "ai_evaluation_datasets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_evaluation_runs"
  ADD CONSTRAINT "ai_evaluation_runs_created_by_id_fkey"
  FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ai_evaluation_runs"
  ADD CONSTRAINT "ai_evaluation_runs_reviewer_employee_id_fkey"
  FOREIGN KEY ("reviewer_employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
