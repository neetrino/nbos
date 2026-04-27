# Report Catalog

> NBOS Reports / Analytics - каталог канонических отчётов по всем модулям.

## Назначение

`Report Catalog` - это библиотека отчётов. Пользователь не должен гадать, где искать аналитику: все отчёты доступны из одного места, но drill-down ведёт в исходные модули.

## Executive Reports

Для Owner / CEO.

Отчёты:

- Company Health Summary;
- Revenue / Expenses / Margin Summary;
- Cash Flow Forecast;
- Receivables and Payables Overview;
- Delivery Risk Summary;
- Sales Pipeline Health;
- Marketing Source Performance;
- Team / KPI Scorecard Summary;
- Support SLA Summary.

Цель: быстро увидеть бизнес в целом за период.

## Sales Reports

Источник данных: CRM + Finance + Marketing attribution.

Отчёты:

- Lead to Deal Funnel;
- Deal Won / Lost by period;
- Pipeline Value by stage;
- Seller Performance;
- Sales Cycle Duration;
- Deal Source Revenue;
- Offer Conversion;
- Stage Blockers Summary;
- Won Deals by Deal Type / Payment Type.

Важно: Sales reports не меняют CRM. Они только читают CRM/Finance facts.

## Marketing Reports

Источник данных: Marketing + CRM + Finance linked spend.

Отчёты:

- Leads by Channel;
- Leads by Marketing Account;
- Leads by Activity / Campaign;
- MQL / SQL / Won by Source;
- Marketing Revenue Attribution;
- List.am Account Performance;
- Campaign Spend vs Result;
- CPL / Cost per SQL / ROI where spend exists;
- Attribution Quality Report.

Если spend отсутствует, report показывает `No spend data`, а не ноль.

## Finance Reports

Источник данных: Finance Journal, Invoices, Payments, Expenses, Subscriptions, Payroll.

Отчёты:

- P&L;
- Cash Flow;
- Invoices Receivable;
- Payments Received;
- Expenses by Category;
- Expense Backlog;
- Salary / Payroll Report;
- Bonus Release Report;
- Partner Payouts Report;
- Project / Product Margin;
- Finance Period Close Report.

Finance reports должны соответствовать Finance Core Architecture.

## Subscription / MRR Reports

Источник данных: Subscriptions + Invoices + Payments.

Отчёты:

- MRR Summary;
- MRR Growth;
- Churn;
- Subscription Payments by Month;
- Upcoming Billing;
- Subscription Coverage;
- Maintenance Pending/Active/On Hold/Canceled/Completed;
- Prepaid Subscription Coverage.

## Delivery Reports

Источник данных: Projects Hub + Tasks + Calendar deadline projections.

Отчёты:

- Product Delivery Timeline;
- Products at Risk;
- On-time Delivery;
- Stage Duration;
- On Hold Analysis;
- QA / Transfer Bottlenecks;
- Work Space / Sprint Performance;
- Product/Extension Completion Report.

## Support Reports

Источник данных: Support Tickets + Projects/Products + Messenger if linked.

Отчёты:

- SLA Compliance;
- First Response Time;
- Resolution Time;
- Ticket Volume by Product;
- Reopen Rate;
- Critical Tickets Summary;
- Support Load by Assignee;
- Maintenance Support Quality.

## KPI / Scorecard Reports

Источник данных: My Company + module facts.

Отчёты:

- Employee KPI Result;
- Department KPI Result;
- KPI Gate for Payroll;
- Seller KPI vs Bonus;
- Marketing KPI;
- Delivery KPI;
- Finance KPI;
- Support KPI.

KPI policy живёт в My Company. Reports показывает results and trends.

## Partner Reports

Источник данных: Partners + CRM + Finance.

Отчёты:

- Partner Revenue;
- Partner Payouts;
- Inbound Referral Performance;
- Outbound Partner Services;
- Partner Balance;
- Partner Agreement Status.

## Credentials / Security Reports

Источник данных: Credentials + Settings Audit.

Отчёты:

- Vault Access Review;
- Secret Reveal Audit;
- Expiring Credentials;
- Access by Employee / Project;
- Offboarding Access Checklist;
- High-risk Credential Events.

Эти отчёты доступны только Owner/Admin и должны иметь строгие permissions.

## Report metadata

Каждый отчёт должен иметь:

```text
ReportDefinition
  key
  title
  category
  owner_module
  description
  default_period
  required_permissions
  supported_filters
  supported_exports
  definitions
```
