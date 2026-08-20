# AI Evaluation, Usage, Cost and Observability

## Purpose

Define how NBOS measures AI quality, reliability, cost and operational behavior across providers, models, agents and domains.

## Core principle

Model/provider choices should become evidence-based over time.

NBOS should be able to answer:

```text
Which agent used which model?
For what domain/use case?
How much did it cost?
How long did it take?
Did tools/actions succeed?
Did fallback occur?
Was the result accepted/approved?
How does quality compare with alternatives?
```

## Dimensions

Usage and evaluation data should be attributable by:

- provider connection;
- provider;
- model;
- model policy/routing profile;
- Internal Agent;
- External Agent where applicable;
- capability/tool;
- domain/module;
- channel/surface;
- employee/customer subject only where permitted and useful;
- execution/correlation ID.

## Execution metrics

Track where available:

- request count;
- success/failure count;
- latency;
- timeout count;
- retry count;
- fallback count;
- rate-limit events;
- input/output token or provider usage units;
- estimated/actual provider cost where available;
- tool/capability call count;
- tool failure rate;
- approval requested/approved/rejected;
- human rework/acceptance signals when available.

Do not store sensitive prompt/context bodies merely to calculate metrics.

## Cost accounting

Provider pricing changes over time, so usage and pricing must be separable.

Conceptually record:

```text
AIUsageRecord
- executionId
- providerConnectionId
- modelId
- inputUnits
- outputUnits
- cached/reasoning/other units when applicable
- providerReportedCost if available
- estimatedCost
- pricingVersion/effective date reference
- currency
- timestamp
```

Historical reports should not silently recalculate old usage using today's pricing unless explicitly requested.

## Budgets and limits

Architecture should support limits by:

- organization;
- provider;
- Internal Agent;
- model policy;
- domain/use case.

Examples:

```text
Client Support <= configured monthly budget
Experimental Agent <= low daily cap
Finance Analytics <= approved model set and budget
```

Budget behavior may be:

- alert only;
- throttle;
- disable optional expensive tier;
- require approval;
- hard stop.

Hard-stop policy must avoid leaving a partially committed domain transaction.

## Model evaluation

New models should not be promoted only because they appear in the provider catalog.

NBOS should support domain-specific evaluation suites over time.

Example evaluation sets:

- client-support accuracy and policy compliance;
- tool-call correctness;
- task interpretation;
- document-writing quality;
- sales analytics reasoning;
- finance analytics accuracy;
- multilingual quality;
- latency/cost.

## Evaluation record

Conceptual fields:

```text
AIEvaluationRun
- id
- suiteId
- modelId/modelPolicyId
- promptVersionId
- dataset/version
- status
- startedAt/completedAt
- aggregate scores
- cost/latency metrics
- reviewer metadata where applicable
```

Tests/data should be versioned enough to compare runs meaningfully.

## Automatic vs human evaluation

Evaluation may combine:

- deterministic checks;
- domain/business assertions;
- human review;
- model-based grading only as a supporting signal.

Do not treat an LLM judge as the sole authority for high-risk correctness.

## Production feedback

Where appropriate, capture operational quality signals:

- human accepted response/action;
- edited before send;
- task returned from review;
- response escalated to human;
- tool call failed;
- customer-support outcome where privacy/policy allows.

These signals may later guide routing/evaluation but should not automatically retrain/change policies without explicit design.

## Routing observability

For PRIMARY_FALLBACK and future adaptive routing, record:

- selected primary candidate;
- why fallback occurred;
- selected fallback;
- number of attempts;
- final model;
- policy/routing version.

Future adaptive routing should be debuggable rather than opaque.

## Dashboards

AI administration should eventually expose:

- total usage/cost;
- cost by provider/model/agent/domain;
- errors/fallbacks;
- latency;
- top capabilities/tools;
- budget status;
- model discovery/evaluation status;
- customer-facing escalation/approval metrics.

## Alerts

Operational alerts may include:

- provider outage/high error rate;
- unexpected cost spike;
- budget threshold;
- excessive fallback;
- repeated policy denials;
- abnormal agent activity;
- model removed/unavailable;
- unusually high customer-facing escalation rate.

## Privacy and retention

Metrics should prefer IDs, counts and safe metadata.

Full prompts/responses/context are not required for routine cost dashboards and should follow separate retention/security policy.

## First implementation scope

Foundation now:

- execution correlation IDs;
- provider/model/agent attribution;
- basic token/usage/cost fields;
- latency/status/error/fallback metrics;
- configurable basic budgets/limits or schema for them;
- admin usage view shell;
- evaluation entity/contracts for future controlled model promotion.

Not required now:

- sophisticated learned router;
- automated benchmark farm;
- automatic model promotion;
- complex forecasting/chargeback.
