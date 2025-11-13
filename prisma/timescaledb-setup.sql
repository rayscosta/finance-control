-- ============================================================================
-- TimescaleDB Setup Script for Finance Control
-- ============================================================================
-- This script enables TimescaleDB and converts time-series tables to hypertables
-- 
-- Prerequisites:
-- 1. TimescaleDB extension installed on PostgreSQL
-- 2. Database backup created
-- 3. All migrations applied
--
-- Usage:
--   psql -U raicosta -h localhost -d finance_control -f prisma/timescaledb-setup.sql
-- ============================================================================

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- ============================================================================
-- Phase 1: Convert tables to hypertables
-- ============================================================================

-- Convert transactions table to hypertable (partitioned by date)
-- This is the most critical table for time-series analytics
SELECT create_hypertable(
    'transactions',
    'date',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE
);

-- Convert credit_card_transactions to hypertable
SELECT create_hypertable(
    'credit_card_transactions',
    'date',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE
);

-- Convert audit_logs to hypertable (important for compliance)
SELECT create_hypertable(
    'audit_logs',
    'createdAt',
    chunk_time_interval => INTERVAL '1 month',
    if_not_exists => TRUE
);

-- ============================================================================
-- Phase 2: Create Continuous Aggregates (Materialized Views)
-- ============================================================================

-- Daily transaction summaries by user
CREATE MATERIALIZED VIEW IF NOT EXISTS transactions_daily
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 day', date) AS bucket,
    "userId",
    "accountId",
    type,
    COUNT(*) AS transaction_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount,
    MIN(amount) AS min_amount,
    MAX(amount) AS max_amount
FROM transactions
GROUP BY bucket, "userId", "accountId", type
WITH NO DATA;

-- Monthly transaction summaries by category
CREATE MATERIALIZED VIEW IF NOT EXISTS transactions_monthly_by_category
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 month', date) AS bucket,
    "userId",
    "categoryId",
    type,
    COUNT(*) AS transaction_count,
    SUM(amount) AS total_amount
FROM transactions
GROUP BY bucket, "userId", "categoryId", type
WITH NO DATA;

-- Monthly account balances
CREATE MATERIALIZED VIEW IF NOT EXISTS account_balances_monthly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 month', date) AS bucket,
    "userId",
    "accountId",
    SUM(CASE WHEN type = 'INCOME' THEN amount ELSE -amount END) AS net_flow
FROM transactions
GROUP BY bucket, "userId", "accountId"
WITH NO DATA;

-- Weekly spending patterns
CREATE MATERIALIZED VIEW IF NOT EXISTS spending_weekly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 week', date) AS bucket,
    "userId",
    SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) AS total_income
FROM transactions
GROUP BY bucket, "userId"
WITH NO DATA;

-- ============================================================================
-- Phase 3: Create Refresh Policies for Continuous Aggregates
-- ============================================================================

-- Refresh daily aggregates every hour
SELECT add_continuous_aggregate_policy('transactions_daily',
    start_offset => INTERVAL '3 days',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour',
    if_not_exists => TRUE
);

-- Refresh monthly aggregates every day
SELECT add_continuous_aggregate_policy('transactions_monthly_by_category',
    start_offset => INTERVAL '3 months',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

SELECT add_continuous_aggregate_policy('account_balances_monthly',
    start_offset => INTERVAL '3 months',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day',
    if_not_exists => TRUE
);

SELECT add_continuous_aggregate_policy('spending_weekly',
    start_offset => INTERVAL '4 weeks',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '6 hours',
    if_not_exists => TRUE
);

-- ============================================================================
-- Phase 4: Create Compression Policies
-- ============================================================================

-- Enable compression on transactions (compress data older than 3 months)
ALTER TABLE transactions SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'userId, accountId',
    timescaledb.compress_orderby = 'date DESC'
);

SELECT add_compression_policy('transactions',
    compress_after => INTERVAL '3 months',
    if_not_exists => TRUE
);

-- Enable compression on credit_card_transactions
ALTER TABLE credit_card_transactions SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'creditCardId',
    timescaledb.compress_orderby = 'date DESC'
);

SELECT add_compression_policy('credit_card_transactions',
    compress_after => INTERVAL '3 months',
    if_not_exists => TRUE
);

-- Enable compression on audit_logs (compress after 6 months for compliance)
ALTER TABLE audit_logs SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'userId, entity',
    timescaledb.compress_orderby = 'createdAt DESC'
);

SELECT add_compression_policy('audit_logs',
    compress_after => INTERVAL '6 months',
    if_not_exists => TRUE
);

-- ============================================================================
-- Phase 5: Create Retention Policies (Optional - commented out by default)
-- ============================================================================

-- Uncomment to enable automatic deletion of old data
-- WARNING: This will permanently delete data older than the specified interval

-- Drop transactions older than 7 years (tax compliance)
-- SELECT add_retention_policy('transactions',
--     drop_after => INTERVAL '7 years',
--     if_not_exists => TRUE
-- );

-- Drop audit logs older than 5 years
-- SELECT add_retention_policy('audit_logs',
--     drop_after => INTERVAL '5 years',
--     if_not_exists => TRUE
-- );

-- ============================================================================
-- Phase 6: Create Helper Views for Common Queries
-- ============================================================================

-- Current month spending by category (using continuous aggregate)
CREATE OR REPLACE VIEW current_month_spending AS
SELECT 
    "userId",
    "categoryId",
    transaction_count,
    total_amount
FROM transactions_monthly_by_category
WHERE bucket = time_bucket('1 month', CURRENT_TIMESTAMP)
  AND type = 'EXPENSE';

-- Last 30 days daily summary (using continuous aggregate)
CREATE OR REPLACE VIEW last_30_days_summary AS
SELECT 
    bucket::date AS date,
    "userId",
    type,
    SUM(total_amount) AS total
FROM transactions_daily
WHERE bucket >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY bucket, "userId", type
ORDER BY bucket DESC;

-- Account balance evolution (using continuous aggregate)
CREATE OR REPLACE VIEW account_balance_evolution AS
SELECT 
    a.id AS account_id,
    a.name AS account_name,
    a."initialBalance" + COALESCE(SUM(ab.net_flow), 0) AS current_balance,
    ab.bucket::date AS as_of_date
FROM accounts a
LEFT JOIN account_balances_monthly ab ON ab."accountId" = a.id
GROUP BY a.id, a.name, a."initialBalance", ab.bucket
ORDER BY a.id, ab.bucket DESC;

-- ============================================================================
-- Phase 7: Verification Queries
-- ============================================================================

-- Check hypertables status
SELECT * FROM timescaledb_information.hypertables
WHERE hypertable_schema = 'public';

-- Check continuous aggregates
SELECT * FROM timescaledb_information.continuous_aggregates
WHERE view_schema = 'public';

-- Check compression policies
SELECT * FROM timescaledb_information.compression_settings
WHERE hypertable_schema = 'public';

-- Check chunks and compression status
SELECT 
    h.table_name,
    c.chunk_name,
    c.range_start,
    c.range_end,
    c.is_compressed,
    pg_size_pretty(total_bytes) AS total_size,
    pg_size_pretty(compressed_total_bytes) AS compressed_size
FROM timescaledb_information.chunks c
JOIN timescaledb_information.hypertables h 
    ON c.hypertable_name = h.table_name
WHERE h.hypertable_schema = 'public'
ORDER BY h.table_name, c.range_start DESC;

-- ============================================================================
-- Phase 8: Performance Optimization Tips
-- ============================================================================

-- COMMENT: After running this script, consider:
--
-- 1. Analyze tables to update statistics:
--    ANALYZE transactions;
--    ANALYZE credit_card_transactions;
--    ANALYZE audit_logs;
--
-- 2. Manually refresh continuous aggregates initially:
--    CALL refresh_continuous_aggregate('transactions_daily', NULL, NULL);
--    CALL refresh_continuous_aggregate('transactions_monthly_by_category', NULL, NULL);
--    CALL refresh_continuous_aggregate('account_balances_monthly', NULL, NULL);
--    CALL refresh_continuous_aggregate('spending_weekly', NULL, NULL);
--
-- 3. Monitor query performance:
--    - Use EXPLAIN ANALYZE for slow queries
--    - Check pg_stat_statements for query statistics
--    - Monitor chunk sizes and compression ratios
--
-- 4. Adjust policies as needed:
--    - Compression interval based on query patterns
--    - Refresh frequency based on data update rate
--    - Chunk interval based on data volume

-- ============================================================================
-- Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'TimescaleDB Setup Complete!';
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '1. Verify hypertables: SELECT * FROM timescaledb_information.hypertables;';
    RAISE NOTICE '2. Refresh continuous aggregates manually (see Phase 8 comments)';
    RAISE NOTICE '3. Update application code to use new views';
    RAISE NOTICE '4. Monitor performance and adjust policies';
    RAISE NOTICE '============================================================';
END $$;
