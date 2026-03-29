-- 企业风险管理系统数据库初始化脚本
-- 在Supabase SQL Editor中执行此脚本

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 公司表
CREATE TABLE IF NOT EXISTS "Company" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "domain" TEXT UNIQUE,
    "plan" TEXT DEFAULT 'free',
    "status" TEXT DEFAULT 'active',
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 部门表
CREATE TABLE IF NOT EXISTS "Department" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "parentId" UUID,
    "companyId" UUID,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("parentId") REFERENCES "Department"("id"),
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
);

-- 用户表
CREATE TABLE IF NOT EXISTS "User" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "email" TEXT UNIQUE NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT DEFAULT 'user',
    "status" TEXT DEFAULT 'active',
    "lastLogin" TIMESTAMP,
    "companyId" UUID,
    "deptId" UUID,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
    FOREIGN KEY ("deptId") REFERENCES "Department"("id")
);

-- 风险表
CREATE TABLE IF NOT EXISTS "Risk" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "riskNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "consequence" TEXT,
    "source" TEXT,
    "likelihood" INTEGER DEFAULT 1,
    "impact" INTEGER DEFAULT 1,
    "riskValue" INTEGER,
    "riskLevel" TEXT,
    "responseStrategy" TEXT,
    "status" TEXT DEFAULT 'active',
    "lastEvaluateAt" TIMESTAMP,
    "nextEvaluateAt" TIMESTAMP,
    "residualRiskValue" INTEGER,
    "residualRiskLevel" TEXT,
    "companyId" UUID,
    "deptId" UUID,
    "ownerId" UUID,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
    FOREIGN KEY ("deptId") REFERENCES "Department"("id"),
    FOREIGN KEY ("ownerId") REFERENCES "User"("id"),
    UNIQUE("companyId", "riskNo")
);

-- 风险应对措施表
CREATE TABLE IF NOT EXISTS "RiskMeasure" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "measureNo" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "startDate" TIMESTAMP,
    "planDate" TIMESTAMP,
    "actualDate" TIMESTAMP,
    "budget" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "status" TEXT DEFAULT 'pending',
    "effectEvaluation" TEXT,
    "remainingIssue" TEXT,
    "companyId" UUID,
    "riskId" UUID,
    "deptId" UUID,
    "ownerId" UUID,
    "collabDeptId" UUID,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
    FOREIGN KEY ("riskId") REFERENCES "Risk"("id"),
    FOREIGN KEY ("deptId") REFERENCES "Department"("id"),
    FOREIGN KEY ("ownerId") REFERENCES "User"("id"),
    FOREIGN KEY ("collabDeptId") REFERENCES "Department"("id")
);

-- KRI指标表
CREATE TABLE IF NOT EXISTS "KRI" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "kriNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "linkedRiskNo" TEXT,
    "formula" TEXT,
    "frequency" TEXT,
    "unit" TEXT,
    "target" DOUBLE PRECISION,
    "warningThreshold" DOUBLE PRECISION,
    "alertThreshold" DOUBLE PRECISION,
    "companyId" UUID,
    "deptId" UUID,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
    FOREIGN KEY ("deptId") REFERENCES "Department"("id"),
    UNIQUE("companyId", "kriNo")
);

-- KRI月度数据表
CREATE TABLE IF NOT EXISTS "KRIMonthlyData" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "month" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "trend" TEXT,
    "status" TEXT,
    "kriId" UUID,
    "companyId" UUID,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("kriId") REFERENCES "KRI"("id"),
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
);

-- 应急预案表
CREATE TABLE IF NOT EXISTS "EmergencyPlan" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "planNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "linkedRiskNo" TEXT,
    "applicableScenario" TEXT,
    "triggerCondition" TEXT,
    "commander" TEXT,
    "siteCommander" TEXT,
    "responseTimeLimit" TEXT,
    "keySteps" TEXT,
    "resourceNeeds" TEXT,
    "drillFrequency" TEXT,
    "lastDrill" TIMESTAMP,
    "nextDrill" TIMESTAMP,
    "drillResult" TEXT,
    "improvement" TEXT,
    "version" TEXT,
    "latestRevision" TIMESTAMP,
    "status" TEXT DEFAULT 'active',
    "companyId" UUID,
    "deptId" UUID,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
    FOREIGN KEY ("deptId") REFERENCES "Department"("id"),
    UNIQUE("companyId", "planNo")
);

-- 风险检查表
CREATE TABLE IF NOT EXISTS "RiskCheck" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "checkNo" TEXT NOT NULL,
    "area" TEXT,
    "category" TEXT,
    "checkItem" TEXT NOT NULL,
    "standard" TEXT,
    "method" TEXT,
    "result" TEXT,
    "issueDesc" TEXT,
    "riskLevel" TEXT,
    "measure" TEXT,
    "deadline" TIMESTAMP,
    "verifyDate" TIMESTAMP,
    "verifyResult" TEXT,
    "verifier" TEXT,
    "checkDate" TIMESTAMP NOT NULL,
    "companyId" UUID,
    "ownerId" UUID,
    "deptId" UUID,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
    FOREIGN KEY ("ownerId") REFERENCES "User"("id"),
    FOREIGN KEY ("deptId") REFERENCES "Department"("id")
);

-- 供应商表
CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "supplierNo" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "supplyCategory" TEXT,
    "supplyItems" TEXT,
    "supplyShare" DOUBLE PRECISION,
    "cooperationYears" INTEGER,
    "replaceability" INTEGER,
    "onTimeRate" DOUBLE PRECISION,
    "qualityRate" DOUBLE PRECISION,
    "priceCompetitiveness" INTEGER,
    "financialStability" INTEGER,
    "serviceCooperation" INTEGER,
    "totalScore" DOUBLE PRECISION,
    "riskLevel" TEXT,
    "hasAgreement" TEXT,
    "agreementExpire" TIMESTAMP,
    "improvementRequire" TEXT,
    "evaluator" TEXT,
    "status" TEXT DEFAULT 'active',
    "companyId" UUID,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("companyId") REFERENCES "Company"("id"),
    UNIQUE("companyId", "supplierNo")
);

-- 培训表
CREATE TABLE IF NOT EXISTS "Training" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "trainingNo" TEXT NOT NULL,
    "trainingDate" TIMESTAMP NOT NULL,
    "topic" TEXT NOT NULL,
    "category" TEXT,
    "level" TEXT,
    "targetDept" TEXT,
    "planCount" INTEGER,
    "actualCount" INTEGER,
    "hours" DOUBLE PRECISION,
    "instructor" TEXT,
    "instructorSource" TEXT,
    "method" TEXT,
    "material" TEXT,
    "examMethod" TEXT,
    "passRate" DOUBLE PRECISION,
    "effectScore" DOUBLE PRECISION,
    "feedback" TEXT,
    "improvement" TEXT,
    "remark" TEXT,
    "companyId" UUID,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
);

-- 培训统计表
CREATE TABLE IF NOT EXISTS "TrainingStats" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "statType" TEXT NOT NULL,
    "target" TEXT,
    "q1Actual" TEXT,
    "q2Actual" TEXT,
    "q3Actual" TEXT,
    "q4Actual" TEXT,
    "yearTotal" TEXT,
    "achievementRate" TEXT,
    "year" INTEGER,
    "companyId" UUID,
    "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
);

-- 创建索引
CREATE INDEX IF NOT EXISTS "User_companyId_idx" ON "User"("companyId");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "Risk_companyId_idx" ON "Risk"("companyId");
CREATE INDEX IF NOT EXISTS "Risk_riskLevel_idx" ON "Risk"("riskLevel");
CREATE INDEX IF NOT EXISTS "Risk_status_idx" ON "Risk"("status");
CREATE INDEX IF NOT EXISTS "KRI_companyId_idx" ON "KRI"("companyId");
CREATE INDEX IF NOT EXISTS "Supplier_companyId_idx" ON "Supplier"("companyId");
CREATE INDEX IF NOT EXISTS "Training_companyId_idx" ON "Training"("companyId");

-- 授予权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
