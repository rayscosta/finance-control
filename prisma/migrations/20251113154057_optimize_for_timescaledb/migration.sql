-- AlterTable: Add password reset fields to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordResetToken" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordResetExpires" TIMESTAMPTZ(6);

-- Add missing models: goals and recurring_transactions
CREATE TABLE IF NOT EXISTS "goals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetAmount" DECIMAL(15,2) NOT NULL,
    "currentAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "recurring_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "categoryId" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "startDate" TIMESTAMPTZ(6) NOT NULL,
    "endDate" TIMESTAMPTZ(6),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TIMESTAMPTZ(6),
    "nextRun" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "recurring_transactions_pkey" PRIMARY KEY ("id")
);

-- Optimize DateTime fields to use TIMESTAMPTZ(6) for all tables
-- This is done using ALTER COLUMN TYPE which will convert existing data

-- Users table
ALTER TABLE "users" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6) USING "createdAt"::TIMESTAMPTZ;
ALTER TABLE "users" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6) USING "updatedAt"::TIMESTAMPTZ;

-- Accounts table
ALTER TABLE "accounts" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6) USING "createdAt"::TIMESTAMPTZ;
ALTER TABLE "accounts" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6) USING "updatedAt"::TIMESTAMPTZ;

-- Transactions table
ALTER TABLE "transactions" ALTER COLUMN "date" TYPE TIMESTAMPTZ(6) USING "date"::TIMESTAMPTZ;
ALTER TABLE "transactions" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6) USING "createdAt"::TIMESTAMPTZ;
ALTER TABLE "transactions" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6) USING "updatedAt"::TIMESTAMPTZ;

-- Categories table
ALTER TABLE "categories" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6) USING "createdAt"::TIMESTAMPTZ;
ALTER TABLE "categories" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6) USING "updatedAt"::TIMESTAMPTZ;

-- Credit cards table
ALTER TABLE "credit_cards" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6) USING "createdAt"::TIMESTAMPTZ;
ALTER TABLE "credit_cards" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6) USING "updatedAt"::TIMESTAMPTZ;

-- Credit card transactions table
ALTER TABLE "credit_card_transactions" ALTER COLUMN "date" TYPE TIMESTAMPTZ(6) USING "date"::TIMESTAMPTZ;
ALTER TABLE "credit_card_transactions" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6) USING "createdAt"::TIMESTAMPTZ;
ALTER TABLE "credit_card_transactions" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6) USING "updatedAt"::TIMESTAMPTZ;

-- Credit card bills table
ALTER TABLE "credit_card_bills" ALTER COLUMN "dueDate" TYPE TIMESTAMPTZ(6) USING "dueDate"::TIMESTAMPTZ;
ALTER TABLE "credit_card_bills" ALTER COLUMN "closingDate" TYPE TIMESTAMPTZ(6) USING "closingDate"::TIMESTAMPTZ;
ALTER TABLE "credit_card_bills" ALTER COLUMN "paidAt" TYPE TIMESTAMPTZ(6) USING "paidAt"::TIMESTAMPTZ;
ALTER TABLE "credit_card_bills" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6) USING "createdAt"::TIMESTAMPTZ;
ALTER TABLE "credit_card_bills" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6) USING "updatedAt"::TIMESTAMPTZ;

-- Budgets table
ALTER TABLE "budgets" ALTER COLUMN "startDate" TYPE TIMESTAMPTZ(6) USING "startDate"::TIMESTAMPTZ;
ALTER TABLE "budgets" ALTER COLUMN "endDate" TYPE TIMESTAMPTZ(6) USING "endDate"::TIMESTAMPTZ;
ALTER TABLE "budgets" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6) USING "createdAt"::TIMESTAMPTZ;
ALTER TABLE "budgets" ALTER COLUMN "updatedAt" TYPE TIMESTAMPTZ(6) USING "updatedAt"::TIMESTAMPTZ;

-- Audit logs table
ALTER TABLE "audit_logs" ALTER COLUMN "createdAt" TYPE TIMESTAMPTZ(6) USING "createdAt"::TIMESTAMPTZ;

-- Optimize JSON fields to use JSONB for better performance
ALTER TABLE "transactions" ALTER COLUMN "extractData" TYPE JSONB USING "extractData"::JSONB;
ALTER TABLE "audit_logs" ALTER COLUMN "oldValue" TYPE JSONB USING "oldValue"::JSONB;
ALTER TABLE "audit_logs" ALTER COLUMN "newValue" TYPE JSONB USING "newValue"::JSONB;

-- Create optimized indexes for time-series queries

-- Transactions indexes (critical for TimescaleDB)
CREATE INDEX IF NOT EXISTS "transactions_userId_date_idx" ON "transactions"("userId", "date" DESC);
CREATE INDEX IF NOT EXISTS "transactions_accountId_date_idx" ON "transactions"("accountId", "date" DESC);
CREATE INDEX IF NOT EXISTS "transactions_categoryId_date_idx" ON "transactions"("categoryId", "date" DESC);
CREATE INDEX IF NOT EXISTS "transactions_date_idx" ON "transactions"("date" DESC);

-- Accounts indexes
CREATE INDEX IF NOT EXISTS "accounts_userId_isActive_idx" ON "accounts"("userId", "isActive");

-- Categories indexes
CREATE INDEX IF NOT EXISTS "categories_userId_isActive_idx" ON "categories"("userId", "isActive");
CREATE INDEX IF NOT EXISTS "categories_isGlobal_isActive_idx" ON "categories"("isGlobal", "isActive");

-- Credit cards indexes
CREATE INDEX IF NOT EXISTS "credit_cards_userId_isActive_idx" ON "credit_cards"("userId", "isActive");

-- Credit card transactions indexes
CREATE INDEX IF NOT EXISTS "credit_card_transactions_creditCardId_date_idx" ON "credit_card_transactions"("creditCardId", "date" DESC);
CREATE INDEX IF NOT EXISTS "credit_card_transactions_billId_idx" ON "credit_card_transactions"("billId");

-- Credit card bills indexes
CREATE INDEX IF NOT EXISTS "credit_card_bills_creditCardId_dueDate_idx" ON "credit_card_bills"("creditCardId", "dueDate" DESC);
CREATE INDEX IF NOT EXISTS "credit_card_bills_creditCardId_isPaid_idx" ON "credit_card_bills"("creditCardId", "isPaid");

-- Budgets indexes
CREATE INDEX IF NOT EXISTS "budgets_userId_startDate_endDate_idx" ON "budgets"("userId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS "budgets_categoryId_startDate_endDate_idx" ON "budgets"("categoryId", "startDate", "endDate");

-- Goals indexes
CREATE INDEX IF NOT EXISTS "goals_userId_deadline_idx" ON "goals"("userId", "deadline");

-- Recurring transactions indexes
CREATE INDEX IF NOT EXISTS "recurring_transactions_userId_isActive_nextRun_idx" ON "recurring_transactions"("userId", "isActive", "nextRun");
CREATE INDEX IF NOT EXISTS "recurring_transactions_nextRun_isActive_idx" ON "recurring_transactions"("nextRun", "isActive");

-- Audit logs indexes (critical for compliance and debugging)
CREATE INDEX IF NOT EXISTS "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_entity_entityId_createdAt_idx" ON "audit_logs"("entity", "entityId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_createdAt_idx" ON "audit_logs"("createdAt" DESC);

-- Create unique constraint for password reset token
CREATE UNIQUE INDEX IF NOT EXISTS "users_passwordResetToken_key" ON "users"("passwordResetToken");

-- Add foreign key constraints for new tables
ALTER TABLE "goals" ADD CONSTRAINT "goals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "recurring_transactions" ADD CONSTRAINT "recurring_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add comments for TimescaleDB conversion (to be executed separately)
COMMENT ON TABLE "transactions" IS 'Ready for TimescaleDB hypertable conversion on date column';
COMMENT ON TABLE "credit_card_transactions" IS 'Ready for TimescaleDB hypertable conversion on date column';
COMMENT ON TABLE "audit_logs" IS 'Ready for TimescaleDB hypertable conversion on createdAt column';
