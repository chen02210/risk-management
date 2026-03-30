-- CreateEnum
CREATE TYPE "CompanyPlan" AS ENUM ('free', 'pro', 'enterprise');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('active', 'suspended', 'expired');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('super_admin', 'company_admin', 'dept_admin', 'user', 'readonly');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('active', 'inactive', 'locked');

-- CreateEnum
CREATE TYPE "RiskCategory" AS ENUM ('safety', 'production', 'quality', 'supply_chain', 'financial', 'compliance', 'information');

-- CreateEnum
CREATE TYPE "RiskResponseStrategy" AS ENUM ('avoid', 'reduce', 'transfer', 'accept');

-- CreateEnum
CREATE TYPE "RiskStatus" AS ENUM ('active', 'closed', 'transferred', 'pending');

-- CreateEnum
CREATE TYPE "MeasureStatus" AS ENUM ('pending', 'in_progress', 'completed', 'delayed', 'cancelled');

-- CreateEnum
CREATE TYPE "KRIFrequency" AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'yearly');

-- CreateEnum
CREATE TYPE "KRITrend" AS ENUM ('up', 'down', 'stable');

-- CreateEnum
CREATE TYPE "KRIStatus" AS ENUM ('normal', 'warning', 'alert');

-- CreateEnum
CREATE TYPE "DrillFrequency" AS ENUM ('monthly', 'quarterly', 'half_yearly', 'yearly');

-- CreateEnum
CREATE TYPE "CheckResult" AS ENUM ('pass', 'fail', 'na');

-- CreateEnum
CREATE TYPE "VerifyResult" AS ENUM ('passed', 'failed', 'pending');

-- CreateEnum
CREATE TYPE "SupplierStatus" AS ENUM ('active', 'inactive', 'blacklisted');

-- CreateEnum
CREATE TYPE "TrainingMethod" AS ENUM ('online', 'offline', 'hybrid');

-- CreateEnum
CREATE TYPE "ExamMethod" AS ENUM ('written', 'practical', 'oral', 'none');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT');

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "domain" VARCHAR(100),
    "plan" "CompanyPlan" NOT NULL DEFAULT 'free',
    "status" "CompanyStatus" NOT NULL DEFAULT 'active',
    "contact_name" VARCHAR(100),
    "contact_phone" VARCHAR(20),
    "contact_email" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "parent_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "role" "UserRole" NOT NULL DEFAULT 'user',
    "dept_id" UUID,
    "status" "UserStatus" NOT NULL DEFAULT 'active',
    "last_login" TIMESTAMP(3),
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "last_ip" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risks" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "risk_no" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "category" "RiskCategory" NOT NULL,
    "description" TEXT,
    "consequence" TEXT,
    "source" VARCHAR(100),
    "likelihood" SMALLINT NOT NULL,
    "impact" SMALLINT NOT NULL,
    "risk_value" SMALLINT NOT NULL,
    "risk_level" VARCHAR(20) NOT NULL,
    "response_strategy" "RiskResponseStrategy",
    "dept_id" UUID,
    "owner_id" UUID,
    "status" "RiskStatus" NOT NULL DEFAULT 'pending',
    "last_evaluate_at" DATE,
    "next_evaluate_at" DATE,
    "residual_likelihood" SMALLINT,
    "residual_impact" SMALLINT,
    "residual_risk_value" SMALLINT,
    "residual_risk_level" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_measures" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "risk_id" UUID NOT NULL,
    "measure_no" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "dept_id" UUID,
    "owner_id" UUID,
    "collaborator_dept" UUID,
    "start_date" DATE,
    "plan_date" DATE,
    "actual_date" DATE,
    "budget" DECIMAL(12,2),
    "actual_cost" DECIMAL(12,2),
    "status" "MeasureStatus" NOT NULL DEFAULT 'pending',
    "effect_evaluation" TEXT,
    "remaining_issue" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "risk_measures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kris" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "kri_no" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "linked_risk_no" VARCHAR(50),
    "description" TEXT,
    "formula" TEXT,
    "frequency" "KRIFrequency" NOT NULL DEFAULT 'monthly',
    "unit" VARCHAR(20),
    "target" DECIMAL(10,2),
    "warning_threshold" DECIMAL(10,2),
    "alert_threshold" DECIMAL(10,2),
    "dept_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "kris_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kri_monthly_data" (
    "id" UUID NOT NULL,
    "kri_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "month" VARCHAR(7) NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "trend" "KRITrend",
    "status" "KRIStatus" NOT NULL DEFAULT 'normal',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "kri_monthly_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emergency_plans" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "plan_no" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "linked_risk_no" VARCHAR(50),
    "applicable_scenario" TEXT,
    "trigger_condition" TEXT,
    "commander" VARCHAR(100),
    "site_commander" VARCHAR(100),
    "response_time_limit" VARCHAR(50),
    "key_steps" TEXT,
    "resource_needs" TEXT,
    "drill_frequency" "DrillFrequency",
    "last_drill" DATE,
    "next_drill" DATE,
    "drill_result" TEXT,
    "improvement" TEXT,
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0',
    "latest_revision" DATE,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "dept_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "updated_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "emergency_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_checks" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "check_no" VARCHAR(50) NOT NULL,
    "area" VARCHAR(100),
    "category" VARCHAR(50),
    "check_item" VARCHAR(200) NOT NULL,
    "standard" TEXT,
    "method" TEXT,
    "result" "CheckResult",
    "issue_desc" TEXT,
    "risk_level" VARCHAR(20),
    "measure" TEXT,
    "owner_id" UUID,
    "deadline" DATE,
    "verify_date" DATE,
    "verify_result" "VerifyResult",
    "verifier" VARCHAR(100),
    "check_date" DATE NOT NULL,
    "checker" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "risk_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "supplier_no" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "supply_category" VARCHAR(50),
    "supply_items" TEXT,
    "supply_share" DECIMAL(5,2),
    "cooperation_years" INTEGER,
    "replaceability" SMALLINT,
    "on_time_rate" DECIMAL(5,2),
    "quality_rate" DECIMAL(5,2),
    "price_competitiveness" SMALLINT,
    "financial_stability" SMALLINT,
    "service_cooperation" SMALLINT,
    "total_score" DECIMAL(6,2),
    "risk_level" VARCHAR(20),
    "has_agreement" BOOLEAN DEFAULT false,
    "agreement_expire" DATE,
    "improvement_require" TEXT,
    "evaluator" VARCHAR(100),
    "evaluate_date" DATE,
    "status" "SupplierStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trainings" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "training_no" VARCHAR(50) NOT NULL,
    "training_date" DATE NOT NULL,
    "topic" VARCHAR(200) NOT NULL,
    "category" VARCHAR(50),
    "level" VARCHAR(50),
    "target_dept" VARCHAR(100),
    "plan_count" INTEGER,
    "actual_count" INTEGER,
    "hours" DECIMAL(4,1),
    "instructor" VARCHAR(100),
    "instructor_source" VARCHAR(20),
    "method" "TrainingMethod" DEFAULT 'offline',
    "material" TEXT,
    "exam_method" "ExamMethod",
    "pass_rate" DECIMAL(5,2),
    "effect_score" DECIMAL(3,1),
    "feedback" TEXT,
    "improvement" TEXT,
    "remark" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "trainings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_stats" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "stat_type" VARCHAR(50) NOT NULL,
    "target" VARCHAR(100),
    "q1_actual" VARCHAR(50),
    "q2_actual" VARCHAR(50),
    "q3_actual" VARCHAR(50),
    "q4_actual" VARCHAR(50),
    "year_total" VARCHAR(50),
    "achievement_rate" VARCHAR(20),
    "year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" UUID,

    CONSTRAINT "training_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "company_id" UUID,
    "user_id" UUID,
    "user_name" VARCHAR(100),
    "action" "AuditAction" NOT NULL,
    "resource" VARCHAR(50) NOT NULL,
    "resource_id" VARCHAR(50),
    "details" TEXT,
    "ip_address" VARCHAR(50),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_domain_key" ON "companies"("domain");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE INDEX "companies_plan_idx" ON "companies"("plan");

-- CreateIndex
CREATE INDEX "departments_company_id_idx" ON "departments"("company_id");

-- CreateIndex
CREATE INDEX "departments_parent_id_idx" ON "departments"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "departments_company_id_name_key" ON "departments"("company_id", "name");

-- CreateIndex
CREATE INDEX "users_company_id_idx" ON "users"("company_id");

-- CreateIndex
CREATE INDEX "users_company_id_status_idx" ON "users"("company_id", "status");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_company_id_email_key" ON "users"("company_id", "email");

-- CreateIndex
CREATE INDEX "risks_company_id_idx" ON "risks"("company_id");

-- CreateIndex
CREATE INDEX "risks_company_id_category_idx" ON "risks"("company_id", "category");

-- CreateIndex
CREATE INDEX "risks_company_id_status_idx" ON "risks"("company_id", "status");

-- CreateIndex
CREATE INDEX "risks_company_id_risk_level_idx" ON "risks"("company_id", "risk_level");

-- CreateIndex
CREATE INDEX "risks_company_id_dept_id_idx" ON "risks"("company_id", "dept_id");

-- CreateIndex
CREATE INDEX "risks_next_evaluate_at_idx" ON "risks"("next_evaluate_at");

-- CreateIndex
CREATE UNIQUE INDEX "risks_company_id_risk_no_key" ON "risks"("company_id", "risk_no");

-- CreateIndex
CREATE INDEX "risk_measures_company_id_idx" ON "risk_measures"("company_id");

-- CreateIndex
CREATE INDEX "risk_measures_company_id_status_idx" ON "risk_measures"("company_id", "status");

-- CreateIndex
CREATE INDEX "risk_measures_risk_id_idx" ON "risk_measures"("risk_id");

-- CreateIndex
CREATE INDEX "risk_measures_plan_date_idx" ON "risk_measures"("plan_date");

-- CreateIndex
CREATE UNIQUE INDEX "risk_measures_risk_id_measure_no_key" ON "risk_measures"("risk_id", "measure_no");

-- CreateIndex
CREATE INDEX "kris_company_id_idx" ON "kris"("company_id");

-- CreateIndex
CREATE INDEX "kris_company_id_dept_id_idx" ON "kris"("company_id", "dept_id");

-- CreateIndex
CREATE UNIQUE INDEX "kris_company_id_kri_no_key" ON "kris"("company_id", "kri_no");

-- CreateIndex
CREATE INDEX "kri_monthly_data_company_id_idx" ON "kri_monthly_data"("company_id");

-- CreateIndex
CREATE INDEX "kri_monthly_data_kri_id_idx" ON "kri_monthly_data"("kri_id");

-- CreateIndex
CREATE INDEX "kri_monthly_data_month_idx" ON "kri_monthly_data"("month");

-- CreateIndex
CREATE UNIQUE INDEX "kri_monthly_data_kri_id_month_key" ON "kri_monthly_data"("kri_id", "month");

-- CreateIndex
CREATE INDEX "emergency_plans_company_id_idx" ON "emergency_plans"("company_id");

-- CreateIndex
CREATE INDEX "emergency_plans_company_id_status_idx" ON "emergency_plans"("company_id", "status");

-- CreateIndex
CREATE INDEX "emergency_plans_next_drill_idx" ON "emergency_plans"("next_drill");

-- CreateIndex
CREATE UNIQUE INDEX "emergency_plans_company_id_plan_no_key" ON "emergency_plans"("company_id", "plan_no");

-- CreateIndex
CREATE INDEX "risk_checks_company_id_idx" ON "risk_checks"("company_id");

-- CreateIndex
CREATE INDEX "risk_checks_company_id_check_date_idx" ON "risk_checks"("company_id", "check_date");

-- CreateIndex
CREATE INDEX "risk_checks_company_id_result_idx" ON "risk_checks"("company_id", "result");

-- CreateIndex
CREATE INDEX "risk_checks_deadline_idx" ON "risk_checks"("deadline");

-- CreateIndex
CREATE UNIQUE INDEX "risk_checks_company_id_check_no_key" ON "risk_checks"("company_id", "check_no");

-- CreateIndex
CREATE INDEX "suppliers_company_id_idx" ON "suppliers"("company_id");

-- CreateIndex
CREATE INDEX "suppliers_company_id_status_idx" ON "suppliers"("company_id", "status");

-- CreateIndex
CREATE INDEX "suppliers_company_id_risk_level_idx" ON "suppliers"("company_id", "risk_level");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_company_id_supplier_no_key" ON "suppliers"("company_id", "supplier_no");

-- CreateIndex
CREATE INDEX "trainings_company_id_idx" ON "trainings"("company_id");

-- CreateIndex
CREATE INDEX "trainings_company_id_training_date_idx" ON "trainings"("company_id", "training_date");

-- CreateIndex
CREATE INDEX "trainings_company_id_category_idx" ON "trainings"("company_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "trainings_company_id_training_no_key" ON "trainings"("company_id", "training_no");

-- CreateIndex
CREATE INDEX "training_stats_company_id_idx" ON "training_stats"("company_id");

-- CreateIndex
CREATE INDEX "training_stats_company_id_year_idx" ON "training_stats"("company_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "training_stats_company_id_stat_type_year_key" ON "training_stats"("company_id", "stat_type", "year");

-- CreateIndex
CREATE INDEX "audit_logs_company_id_idx" ON "audit_logs"("company_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "departments" ADD CONSTRAINT "departments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risks" ADD CONSTRAINT "risks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risks" ADD CONSTRAINT "risks_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risks" ADD CONSTRAINT "risks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_measures" ADD CONSTRAINT "risk_measures_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_measures" ADD CONSTRAINT "risk_measures_risk_id_fkey" FOREIGN KEY ("risk_id") REFERENCES "risks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_measures" ADD CONSTRAINT "risk_measures_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_measures" ADD CONSTRAINT "risk_measures_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kris" ADD CONSTRAINT "kris_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kris" ADD CONSTRAINT "kris_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kri_monthly_data" ADD CONSTRAINT "kri_monthly_data_kri_id_fkey" FOREIGN KEY ("kri_id") REFERENCES "kris"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kri_monthly_data" ADD CONSTRAINT "kri_monthly_data_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_plans" ADD CONSTRAINT "emergency_plans_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emergency_plans" ADD CONSTRAINT "emergency_plans_dept_id_fkey" FOREIGN KEY ("dept_id") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_checks" ADD CONSTRAINT "risk_checks_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_checks" ADD CONSTRAINT "risk_checks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_stats" ADD CONSTRAINT "training_stats_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
