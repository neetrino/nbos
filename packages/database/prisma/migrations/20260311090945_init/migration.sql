-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('CLIENT', 'PARTNER', 'CONTRACTOR', 'OTHER');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('LEGAL', 'INDIVIDUAL', 'SOLE_PROPRIETOR');

-- CreateEnum
CREATE TYPE "TaxStatus" AS ENUM ('TAX', 'TAX_FREE');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('WHITE_LABEL', 'MIX', 'CUSTOM_CODE');

-- CreateEnum
CREATE TYPE "ProductTypeEnum" AS ENUM ('WEBSITE', 'MOBILE_APP', 'CRM', 'LOGO', 'SMM', 'SEO', 'OTHER');

-- CreateEnum
CREATE TYPE "ProductStatusEnum" AS ENUM ('NEW', 'CREATING', 'DEVELOPMENT', 'QA', 'TRANSFER', 'ON_HOLD', 'DONE', 'LOST');

-- CreateEnum
CREATE TYPE "ExtensionSize" AS ENUM ('MICRO', 'SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "ExtensionStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeadStatusEnum" AS ENUM ('NEW', 'DIDNT_GET_THROUGH', 'CONTACT_ESTABLISHED', 'MQL', 'SPAM', 'FROZEN', 'SQL');

-- CreateEnum
CREATE TYPE "LeadSourceEnum" AS ENUM ('INSTAGRAM', 'FACEBOOK', 'WEBSITE', 'COLD_CALL', 'PARTNER', 'REFERRAL');

-- CreateEnum
CREATE TYPE "DealStatusEnum" AS ENUM ('START_CONVERSATION', 'DISCUSS_NEEDS', 'MEETING', 'CAN_WE_DO_IT', 'SEND_OFFER', 'GET_ANSWER', 'DEPOSIT_AND_CONTRACT', 'CREATING', 'GET_FINAL_PAY', 'MAINTENANCE_OFFER', 'FAILED', 'WON');

-- CreateEnum
CREATE TYPE "DealTypeEnum" AS ENUM ('NEW_CLIENT', 'EXTENSION', 'UPSELL');

-- CreateEnum
CREATE TYPE "OrderTypeEnum" AS ENUM ('PRODUCT', 'EXTENSION', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "PaymentTypeEnum" AS ENUM ('CLASSIC_50_50', 'CLASSIC_30_30_40', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "OrderStatusEnum" AS ENUM ('ACTIVE', 'PARTIALLY_PAID', 'FULLY_PAID', 'CLOSED');

-- CreateEnum
CREATE TYPE "InvoiceTypeEnum" AS ENUM ('DEVELOPMENT', 'EXTENSION', 'SUBSCRIPTION', 'DOMAIN', 'SERVICE');

-- CreateEnum
CREATE TYPE "InvoiceStatusEnum" AS ENUM ('NEW', 'CREATED_IN_GOV', 'SENT', 'OVERDUE', 'ON_HOLD', 'PAID', 'UNPAID');

-- CreateEnum
CREATE TYPE "SubscriptionTypeEnum" AS ENUM ('MAINTENANCE_ONLY', 'DEV_AND_MAINTENANCE', 'DEV_ONLY', 'PARTNER_SERVICE');

-- CreateEnum
CREATE TYPE "SubscriptionStatusEnum" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpenseTypeEnum" AS ENUM ('PLANNED', 'UNPLANNED');

-- CreateEnum
CREATE TYPE "ExpenseCategoryEnum" AS ENUM ('DOMAIN', 'HOSTING', 'SERVICE', 'MARKETING', 'SALARY', 'BONUS', 'PARTNER_PAYOUT', 'TOOLS', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseFrequency" AS ENUM ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'MULTI_YEAR');

-- CreateEnum
CREATE TYPE "ExpenseStatusEnum" AS ENUM ('THIS_MONTH', 'PAY_NOW', 'DELAYED', 'ON_HOLD', 'PAID', 'UNPAID');

-- CreateEnum
CREATE TYPE "BonusTypeEnum" AS ENUM ('SALES', 'DELIVERY', 'PM', 'DESIGN', 'MARKETING');

-- CreateEnum
CREATE TYPE "BonusStatusEnum" AS ENUM ('INCOMING', 'EARNED', 'PENDING_ELIGIBILITY', 'VESTED', 'HOLDBACK', 'ACTIVE', 'PAID', 'CLAWBACK');

-- CreateEnum
CREATE TYPE "TaskStatusEnum" AS ENUM ('BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriorityEnum" AS ENUM ('CRITICAL', 'HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "TicketCategoryEnum" AS ENUM ('INCIDENT', 'SERVICE_REQUEST', 'CHANGE_REQUEST', 'PROBLEM');

-- CreateEnum
CREATE TYPE "TicketPriorityEnum" AS ENUM ('P1', 'P2', 'P3');

-- CreateEnum
CREATE TYPE "TicketStatusEnum" AS ENUM ('NEW', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "CredentialCategoryEnum" AS ENUM ('ADMIN', 'DOMAIN', 'HOSTING', 'SERVICE', 'APP', 'MAIL', 'API_KEY', 'DATABASE');

-- CreateEnum
CREATE TYPE "CredentialAccessLevelEnum" AS ENUM ('SECRET', 'PROJECT_TEAM', 'DEPARTMENT', 'ALL');

-- CreateEnum
CREATE TYPE "DomainStatusEnum" AS ENUM ('ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'TRANSFERRED');

-- CreateEnum
CREATE TYPE "EmployeeRoleEnum" AS ENUM ('CEO', 'SELLER', 'PM', 'DEVELOPER', 'JUNIOR_DEVELOPER', 'DESIGNER', 'QA', 'TECH_SPECIALIST', 'FINANCE_DIRECTOR', 'MARKETING', 'HEAD_SALES', 'HEAD_DELIVERY');

-- CreateEnum
CREATE TYPE "EmployeeLevelEnum" AS ENUM ('JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD', 'HEAD');

-- CreateEnum
CREATE TYPE "EmployeeStatusEnum" AS ENUM ('ACTIVE', 'PROBATION', 'ON_LEAVE', 'FIRED');

-- CreateEnum
CREATE TYPE "PartnerTypeEnum" AS ENUM ('REGULAR', 'PREMIUM');

-- CreateEnum
CREATE TYPE "PartnerDirectionEnum" AS ENUM ('INBOUND', 'OUTBOUND', 'BOTH');

-- CreateEnum
CREATE TYPE "PartnerStatusEnum" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "messenger_links" JSONB,
    "role" "ContactRole" NOT NULL DEFAULT 'CLIENT',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CompanyType" NOT NULL DEFAULT 'LEGAL',
    "tax_id" TEXT,
    "legal_address" TEXT,
    "bank_details" JSONB,
    "taxStatus" "TaxStatus" NOT NULL DEFAULT 'TAX',
    "contact_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "company_id" TEXT,
    "type" "ProjectType" NOT NULL DEFAULT 'CUSTOM_CODE',
    "seller_id" TEXT,
    "pm_id" TEXT,
    "deadline" TIMESTAMP(3),
    "description" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "product_type" "ProductTypeEnum" NOT NULL,
    "status" "ProductStatusEnum" NOT NULL DEFAULT 'NEW',
    "pm_id" TEXT,
    "deadline" TIMESTAMP(3),
    "checklist_template_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extensions" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "product_id" TEXT,
    "name" TEXT NOT NULL,
    "size" "ExtensionSize" NOT NULL DEFAULT 'SMALL',
    "status" "ExtensionStatus" NOT NULL DEFAULT 'NEW',
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "source" "LeadSourceEnum" NOT NULL,
    "status" "LeadStatusEnum" NOT NULL DEFAULT 'NEW',
    "assigned_to" TEXT,
    "contact_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lead_id" TEXT,
    "contact_id" TEXT NOT NULL,
    "project_id" TEXT,
    "type" "DealTypeEnum" NOT NULL,
    "status" "DealStatusEnum" NOT NULL DEFAULT 'START_CONVERSATION',
    "amount" DECIMAL(12,2),
    "payment_type" "PaymentTypeEnum",
    "seller_id" TEXT NOT NULL,
    "source" "LeadSourceEnum",
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "deal_id" TEXT,
    "product_id" TEXT,
    "extension_id" TEXT,
    "type" "OrderTypeEnum" NOT NULL,
    "payment_type" "PaymentTypeEnum" NOT NULL,
    "total_amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'AMD',
    "tax_status" "TaxStatus" NOT NULL DEFAULT 'TAX',
    "status" "OrderStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "partner_id" TEXT,
    "partner_percent" DECIMAL(5,2) DEFAULT 30,
    "seller_bonus_percent" DECIMAL(5,2),
    "delivery_bonus_percent" DECIMAL(5,2),
    "seller_bonus_source" "LeadSourceEnum",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "order_id" TEXT,
    "subscription_id" TEXT,
    "project_id" TEXT NOT NULL,
    "company_id" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "tax_status" "TaxStatus" NOT NULL DEFAULT 'TAX',
    "type" "InvoiceTypeEnum" NOT NULL,
    "status" "InvoiceStatusEnum" NOT NULL DEFAULT 'NEW',
    "due_date" TIMESTAMP(3),
    "paid_date" TIMESTAMP(3),
    "gov_invoice_id" TEXT,
    "payment_link" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "payment_method" TEXT,
    "confirmed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" "SubscriptionTypeEnum" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "billing_day" INTEGER NOT NULL,
    "tax_status" "TaxStatus" NOT NULL DEFAULT 'TAX',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" "SubscriptionStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "partner_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "type" "ExpenseTypeEnum" NOT NULL,
    "category" "ExpenseCategoryEnum" NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "frequency" "ExpenseFrequency" NOT NULL DEFAULT 'ONE_TIME',
    "due_date" TIMESTAMP(3),
    "status" "ExpenseStatusEnum" NOT NULL DEFAULT 'THIS_MONTH',
    "project_id" TEXT,
    "is_pass_through" BOOLEAN NOT NULL DEFAULT false,
    "tax_status" "TaxStatus" NOT NULL DEFAULT 'TAX',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bonus_entries" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" "BonusTypeEnum" NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "percent" DECIMAL(5,2) NOT NULL,
    "status" "BonusStatusEnum" NOT NULL DEFAULT 'INCOMING',
    "kpi_gate_passed" BOOLEAN,
    "holdback_percent" DECIMAL(5,2) DEFAULT 20,
    "holdback_release_date" TIMESTAMP(3),
    "payout_month" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "project_id" TEXT NOT NULL,
    "product_id" TEXT,
    "extension_id" TEXT,
    "creator_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "co_assignees" TEXT[],
    "observers" TEXT[],
    "status" "TaskStatusEnum" NOT NULL DEFAULT 'BACKLOG',
    "priority" "TaskPriorityEnum" NOT NULL DEFAULT 'NORMAL',
    "sprint_id" TEXT,
    "due_date" TIMESTAMP(3),
    "has_chat" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "product_id" TEXT,
    "contact_id" TEXT,
    "category" "TicketCategoryEnum" NOT NULL,
    "priority" "TicketPriorityEnum" NOT NULL DEFAULT 'P3',
    "status" "TicketStatusEnum" NOT NULL DEFAULT 'NEW',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "billable" BOOLEAN NOT NULL DEFAULT false,
    "assigned_to" TEXT,
    "sla_response_deadline" TIMESTAMP(3),
    "sla_resolve_deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "category" "CredentialCategoryEnum" NOT NULL,
    "provider" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "login" TEXT,
    "password" TEXT,
    "api_key" TEXT,
    "env_data" TEXT,
    "access_level" "CredentialAccessLevelEnum" NOT NULL DEFAULT 'PROJECT_TEAM',
    "allowed_employees" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "domains" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "domain_name" TEXT NOT NULL,
    "provider" TEXT,
    "purchase_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "renewal_cost" DECIMAL(10,2),
    "client_charge" DECIMAL(10,2),
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "status" "DomainStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" TEXT NOT NULL,
    "clerk_user_id" TEXT,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "EmployeeRoleEnum" NOT NULL,
    "department" TEXT,
    "level" "EmployeeLevelEnum",
    "base_salary" DECIMAL(12,2),
    "work_schedule" JSONB,
    "status" "EmployeeStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PartnerTypeEnum" NOT NULL DEFAULT 'REGULAR',
    "direction" "PartnerDirectionEnum" NOT NULL DEFAULT 'INBOUND',
    "default_percent" DECIMAL(5,2) NOT NULL DEFAULT 30,
    "status" "PartnerStatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "contact_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "changes" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "leads_code_key" ON "leads"("code");

-- CreateIndex
CREATE UNIQUE INDEX "deals_code_key" ON "deals"("code");

-- CreateIndex
CREATE UNIQUE INDEX "deals_lead_id_key" ON "deals"("lead_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_code_key" ON "orders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "orders_product_id_key" ON "orders"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_extension_id_key" ON "orders"("extension_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_code_key" ON "invoices"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_code_key" ON "subscriptions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_code_key" ON "tasks"("code");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_code_key" ON "support_tickets"("code");

-- CreateIndex
CREATE UNIQUE INDEX "domains_domain_name_key" ON "domains"("domain_name");

-- CreateIndex
CREATE UNIQUE INDEX "employees_clerk_user_id_key" ON "employees"("clerk_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "employees_email_key" ON "employees"("email");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_pm_id_fkey" FOREIGN KEY ("pm_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_pm_id_fkey" FOREIGN KEY ("pm_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extensions" ADD CONSTRAINT "extensions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extensions" ADD CONSTRAINT "extensions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extensions" ADD CONSTRAINT "extensions_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_extension_id_fkey" FOREIGN KEY ("extension_id") REFERENCES "extensions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_confirmed_by_fkey" FOREIGN KEY ("confirmed_by") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_entries" ADD CONSTRAINT "bonus_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_entries" ADD CONSTRAINT "bonus_entries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bonus_entries" ADD CONSTRAINT "bonus_entries_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_extension_id_fkey" FOREIGN KEY ("extension_id") REFERENCES "extensions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domains" ADD CONSTRAINT "domains_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
