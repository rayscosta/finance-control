# 🗄️ Database Schema - Finance Control

## Overview

Sistema de controle financeiro com suporte a **TimescaleDB** para otimização de séries temporais.

### Tecnologias
- **Database**: PostgreSQL 16+
- **Extension**: TimescaleDB 2.x
- **ORM**: Prisma 5.x
- **Migration Tool**: Prisma Migrate

---

## 📊 Entity Relationship Diagram

```
┌─────────────────────┐
│       User          │
│─────────────────────│
│ id (PK)            │◀──────────┐
│ email (UNIQUE)     │           │
│ password (HASH)    │           │
│ name               │           │
│ createdAt          │           │
│ updatedAt          │           │
│ passwordResetToken │           │
│ passwordResetExpires│          │
└─────────────────────┘           │
         │                        │
         │ 1:N                    │
         ├────────────────────────┼─────────────────────┐
         │                        │                     │
         ▼                        ▼                     ▼
┌──────────────────┐    ┌──────────────────┐  ┌─────────────────┐
│    Account       │    │    Category      │  │   CreditCard    │
│──────────────────│    │──────────────────│  │─────────────────│
│ id (PK)         │    │ id (PK)         │  │ id (PK)        │
│ userId (FK)     │◀┐  │ userId (FK/NULL)│  │ userId (FK)    │
│ name            │ │  │ name            │  │ name           │
│ type (ENUM)     │ │  │ type (ENUM)     │  │ bank           │
│ bank            │ │  │ color           │  │ lastFourDigits │
│ agency          │ │  │ icon            │  │ limit          │
│ accountNumber   │ │  │ isGlobal (BOOL) │  │ closingDay     │
│ balance         │ │  │ isActive        │  │ dueDay         │
│ description     │ │  │ createdAt       │  │ isActive       │
│ isActive        │ │  │ updatedAt       │  │ createdAt      │
│ createdAt       │ │  └──────────────────┘  │ updatedAt      │
│ updatedAt       │ │           │            └─────────────────┘
└──────────────────┘ │           │                     │
         │           │           │ 1:N                 │ 1:N
         │ 1:N       │           │                     │
         ▼           │           ▼                     ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│     Transaction          │  │  CreditCardTransaction   │
│──────────────────────────│  │──────────────────────────│
│ id (PK)                 │  │ id (PK)                 │
│ userId (FK)             │  │ creditCardId (FK)       │
│ accountId (FK)          │──┘ │ billId (FK/NULL)        │
│ categoryId (FK/NULL)    │◀───│ amount                  │
│ amount                  │    │ description             │
│ type (ENUM)             │    │ date (TIMESTAMPTZ) ⏰   │
│ description             │    │ installments            │
│ date (TIMESTAMPTZ) ⏰   │    │ currentInstallment      │
│ referenceNumber         │    │ merchant                │
│ extractData (JSON)      │    │ category                │
│ isRecurring             │    │ createdAt               │
│ recurringType (ENUM)    │    │ updatedAt               │
│ createdAt               │    └──────────────────────────┘
│ updatedAt               │              │
└──────────────────────────┘              │ N:1
         ▲                                ▼
         │                      ┌──────────────────────┐
         │                      │   CreditCardBill     │
         │                      │──────────────────────│
         │                      │ id (PK)             │
         │                      │ creditCardId (FK)   │
         │                      │ amount              │
         │                      │ dueDate             │
         │                      │ closingDate         │
         │                      │ isPaid              │
         │                      │ paidAt              │
         │                      │ createdAt           │
         │                      │ updatedAt           │
         │                      └──────────────────────┘
         │
         │ N:1
         │
┌─────────────────────┐
│       Budget        │
│─────────────────────│
│ id (PK)            │
│ userId (FK)        │
│ categoryId (FK)    │
│ amount             │
│ spent              │
│ month              │
│ year               │
│ createdAt          │
│ updatedAt          │
│ UNIQUE(user,cat,   │
│        month,year) │
└─────────────────────┘

┌─────────────────────┐
│     AuditLog        │
│─────────────────────│
│ id (PK)            │
│ userId (FK/NULL)   │
│ action             │
│ entity             │
│ entityId           │
│ oldValue (JSON)    │
│ newValue (JSON)    │
│ ipAddress          │
│ userAgent          │
│ createdAt ⏰       │
└─────────────────────┘

Legend:
⏰ = TimescaleDB Hypertable partition key
PK = Primary Key
FK = Foreign Key
ENUM = Enumeration type
```

---

## 📋 Table Schemas

### 1. User

**Propósito**: Armazena dados de autenticação e perfil dos usuários.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Identificador único |
| email | STRING | UNIQUE, NOT NULL | Email de login |
| password | STRING | NOT NULL | Hash bcrypt (min 10 rounds) |
| name | STRING | NOT NULL | Nome completo |
| createdAt | TIMESTAMP | DEFAULT now() | Data de criação |
| updatedAt | TIMESTAMP | AUTO UPDATE | Data de atualização |
| passwordResetToken | STRING | NULLABLE, UNIQUE | Token de reset de senha |
| passwordResetExpires | TIMESTAMP | NULLABLE | Expiração do token |

**Índices:**
```sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_reset_token ON users(passwordResetToken) WHERE passwordResetToken IS NOT NULL;
```

**Constraints:**
- Email deve ser único e válido
- Password sempre hashado (nunca plain text)
- PasswordResetToken expira em 24 horas

---

### 2. Account

**Propósito**: Contas bancárias, carteiras e investimentos do usuário.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Identificador único |
| userId | CUID | FK → User, NOT NULL | Dono da conta |
| name | STRING | NOT NULL | Nome da conta |
| type | ENUM | NOT NULL | Tipo de conta |
| bank | STRING | NULLABLE | Nome do banco |
| agency | STRING | NULLABLE | Agência |
| accountNumber | STRING | NULLABLE | Número da conta |
| balance | DECIMAL(15,2) | NOT NULL, DEFAULT 0 | Saldo atual |
| description | STRING | NULLABLE | Descrição adicional |
| isActive | BOOLEAN | DEFAULT true | Conta ativa? |
| createdAt | TIMESTAMP | DEFAULT now() | Data de criação |
| updatedAt | TIMESTAMP | AUTO UPDATE | Data de atualização |

**Enumeração AccountType:**
```typescript
enum AccountType {
  CHECKING      // Conta corrente
  SAVINGS       // Poupança
  CREDIT        // Cartão de crédito
  INVESTMENT    // Investimentos
  CRYPTO        // Criptomoedas
}
```

**Índices:**
```sql
CREATE INDEX idx_account_user ON accounts(userId);
CREATE INDEX idx_account_type ON accounts(type);
CREATE INDEX idx_account_active ON accounts(isActive) WHERE isActive = true;
```

**Regras de Negócio:**
- Balance sempre em Decimal (precisão financeira)
- Soft delete via isActive (não deletar registros)
- Um usuário pode ter múltiplas contas do mesmo tipo

---

### 3. Category

**Propósito**: Categorias de receita/despesa (sistema híbrido).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Identificador único |
| userId | CUID | FK → User, NULLABLE | Dono (NULL = global) |
| name | STRING | NOT NULL | Nome da categoria |
| type | ENUM | NOT NULL | Receita ou despesa |
| color | STRING | NULLABLE | Cor hex (#RRGGBB) |
| icon | STRING | NULLABLE | Emoji ou código |
| isGlobal | BOOLEAN | DEFAULT false | Categoria global? |
| isActive | BOOLEAN | DEFAULT true | Categoria ativa? |
| createdAt | TIMESTAMP | DEFAULT now() | Data de criação |
| updatedAt | TIMESTAMP | AUTO UPDATE | Data de atualização |

**Enumeração CategoryType:**
```typescript
enum CategoryType {
  INCOME    // Receita
  EXPENSE   // Despesa
}
```

**Índices:**
```sql
CREATE INDEX idx_category_user ON categories(userId);
CREATE INDEX idx_category_global ON categories(isGlobal) WHERE isGlobal = true;
CREATE INDEX idx_category_type ON categories(type);
CREATE INDEX idx_category_active ON categories(isActive) WHERE isActive = true;
CREATE UNIQUE INDEX idx_category_name_user ON categories(name, userId) WHERE userId IS NOT NULL;
```

**Sistema Híbrido:**
- **Globais**: userId = NULL, isGlobal = true (47 categorias padrão)
- **Personalizadas**: userId = X, isGlobal = false
- Queries otimizadas: buscar globais + user-specific

---

### 4. Transaction ⭐ (TimescaleDB Hypertable)

**Propósito**: Registros de transações financeiras (receitas, despesas, transferências).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Identificador único |
| userId | CUID | FK → User, NOT NULL | Dono da transação |
| accountId | CUID | FK → Account, NOT NULL | Conta relacionada |
| categoryId | CUID | FK → Category, NULLABLE | Categoria (opcional) |
| amount | DECIMAL(15,2) | NOT NULL | Valor da transação |
| type | ENUM | NOT NULL | Tipo de transação |
| description | STRING | NOT NULL | Descrição |
| date | TIMESTAMPTZ | NOT NULL | **Data da transação** 🔑 |
| referenceNumber | STRING | NULLABLE | Número de referência |
| extractData | JSON | NULLABLE | Dados brutos do extrato |
| isRecurring | BOOLEAN | DEFAULT false | É recorrente? |
| recurringType | ENUM | NULLABLE | Tipo de recorrência |
| createdAt | TIMESTAMP | DEFAULT now() | Data de criação |
| updatedAt | TIMESTAMP | AUTO UPDATE | Data de atualização |

**Enumeração TransactionType:**
```typescript
enum TransactionType {
  INCOME      // Receita
  EXPENSE     // Despesa
  TRANSFER    // Transferência
}
```

**Enumeração RecurringType:**
```typescript
enum RecurringType {
  DAILY       // Diária
  WEEKLY      // Semanal
  MONTHLY     // Mensal
  YEARLY      // Anual
}
```

**TimescaleDB Configuration:**
```sql
-- Converter para hypertable (particionamento por data)
SELECT create_hypertable(
  'transactions', 
  'date',
  chunk_time_interval => INTERVAL '1 month',
  if_not_exists => TRUE
);

-- Índices específicos para time-series
CREATE INDEX idx_transaction_date ON transactions(date DESC);
CREATE INDEX idx_transaction_user_date ON transactions(userId, date DESC);
CREATE INDEX idx_transaction_account_date ON transactions(accountId, date DESC);
CREATE INDEX idx_transaction_category_date ON transactions(categoryId, date DESC);
CREATE INDEX idx_transaction_type_date ON transactions(type, date DESC);

-- Continuous Aggregate para dashboard diário
CREATE MATERIALIZED VIEW daily_transaction_summary
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 day', date) AS day,
  userId,
  categoryId,
  type,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM transactions
GROUP BY day, userId, categoryId, type
WITH NO DATA;

-- Refresh policy automático
SELECT add_continuous_aggregate_policy(
  'daily_transaction_summary',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour'
);

-- Compressão para dados históricos (>6 meses)
ALTER TABLE transactions SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'userId, type'
);

SELECT add_compression_policy(
  'transactions',
  INTERVAL '6 months'
);

-- Data retention (manter 7 anos por padrão)
SELECT add_retention_policy(
  'transactions',
  INTERVAL '7 years'
);
```

**Queries Otimizadas:**
```sql
-- Dashboard: transações dos últimos 30 dias
SELECT * FROM transactions
WHERE userId = $1
  AND date >= now() - INTERVAL '30 days'
ORDER BY date DESC;

-- Agregação mensal usando continuous aggregate
SELECT 
  day,
  type,
  SUM(total_amount) as monthly_total
FROM daily_transaction_summary
WHERE userId = $1
  AND day >= date_trunc('month', now() - INTERVAL '6 months')
GROUP BY time_bucket('1 month', day), type;

-- Cash flow projection
WITH recent_expenses AS (
  SELECT 
    categoryId,
    AVG(amount) as avg_amount
  FROM transactions
  WHERE userId = $1
    AND type = 'EXPENSE'
    AND date >= now() - INTERVAL '3 months'
  GROUP BY categoryId
),
recurring AS (
  SELECT 
    categoryId,
    amount,
    recurringType
  FROM transactions
  WHERE userId = $1
    AND isRecurring = true
    AND date >= now()
)
SELECT 
  r.categoryId,
  r.avg_amount as historical_avg,
  COALESCE(SUM(rec.amount), 0) as recurring_total
FROM recent_expenses r
LEFT JOIN recurring rec ON r.categoryId = rec.categoryId
GROUP BY r.categoryId, r.avg_amount;
```

---

### 5. CreditCard

**Propósito**: Cadastro de cartões de crédito.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Identificador único |
| userId | CUID | FK → User, NOT NULL | Dono do cartão |
| name | STRING | NOT NULL | Nome do cartão |
| bank | STRING | NOT NULL | Banco emissor |
| lastFourDigits | CHAR(4) | NOT NULL | Últimos 4 dígitos |
| limit | DECIMAL(15,2) | NOT NULL | Limite do cartão |
| closingDay | INTEGER | NOT NULL | Dia de fechamento (1-31) |
| dueDay | INTEGER | NOT NULL | Dia de vencimento (1-31) |
| isActive | BOOLEAN | DEFAULT true | Cartão ativo? |
| createdAt | TIMESTAMP | DEFAULT now() | Data de criação |
| updatedAt | TIMESTAMP | AUTO UPDATE | Data de atualização |

**Índices:**
```sql
CREATE INDEX idx_creditcard_user ON credit_cards(userId);
CREATE INDEX idx_creditcard_active ON credit_cards(isActive) WHERE isActive = true;
```

**Constraints:**
- closingDay deve ser < dueDay
- lastFourDigits exatamente 4 caracteres
- limit > 0

---

### 6. CreditCardTransaction

**Propósito**: Transações de cartão de crédito com parcelamento.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Identificador único |
| creditCardId | CUID | FK → CreditCard, NOT NULL | Cartão usado |
| billId | CUID | FK → CreditCardBill, NULLABLE | Fatura relacionada |
| amount | DECIMAL(15,2) | NOT NULL | Valor da compra |
| description | STRING | NOT NULL | Descrição |
| date | TIMESTAMPTZ | NOT NULL | Data da compra |
| installments | INTEGER | DEFAULT 1 | Número de parcelas |
| currentInstallment | INTEGER | DEFAULT 1 | Parcela atual |
| merchant | STRING | NULLABLE | Estabelecimento |
| category | STRING | NULLABLE | Categoria |
| createdAt | TIMESTAMP | DEFAULT now() | Data de criação |
| updatedAt | TIMESTAMP | AUTO UPDATE | Data de atualização |

**Índices:**
```sql
CREATE INDEX idx_cc_transaction_card ON credit_card_transactions(creditCardId);
CREATE INDEX idx_cc_transaction_bill ON credit_card_transactions(billId);
CREATE INDEX idx_cc_transaction_date ON credit_card_transactions(date DESC);
```

**Regras:**
- currentInstallment <= installments
- Parcelamento automático: criar N transações (uma por parcela)

---

### 7. CreditCardBill

**Propósito**: Faturas mensais de cartões de crédito.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Identificador único |
| creditCardId | CUID | FK → CreditCard, NOT NULL | Cartão da fatura |
| amount | DECIMAL(15,2) | NOT NULL | Valor total da fatura |
| dueDate | TIMESTAMP | NOT NULL | Data de vencimento |
| closingDate | TIMESTAMP | NOT NULL | Data de fechamento |
| isPaid | BOOLEAN | DEFAULT false | Fatura paga? |
| paidAt | TIMESTAMP | NULLABLE | Data do pagamento |
| createdAt | TIMESTAMP | DEFAULT now() | Data de criação |
| updatedAt | TIMESTAMP | AUTO UPDATE | Data de atualização |

**Índices:**
```sql
CREATE INDEX idx_cc_bill_card ON credit_card_bills(creditCardId);
CREATE INDEX idx_cc_bill_due ON credit_card_bills(dueDate);
CREATE INDEX idx_cc_bill_paid ON credit_card_bills(isPaid) WHERE isPaid = false;
```

**Cálculo Automático:**
```sql
-- Trigger para atualizar amount automaticamente
CREATE OR REPLACE FUNCTION update_bill_amount()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE credit_card_bills
  SET amount = (
    SELECT COALESCE(SUM(amount), 0)
    FROM credit_card_transactions
    WHERE billId = NEW.billId
  )
  WHERE id = NEW.billId;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_bill_amount
AFTER INSERT OR UPDATE OR DELETE ON credit_card_transactions
FOR EACH ROW
EXECUTE FUNCTION update_bill_amount();
```

---

### 8. Budget

**Propósito**: Orçamentos mensais por categoria.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Identificador único |
| userId | CUID | FK → User, NOT NULL | Dono do orçamento |
| categoryId | CUID | FK → Category, NOT NULL | Categoria orçada |
| amount | DECIMAL(15,2) | NOT NULL | Valor do orçamento |
| spent | DECIMAL(15,2) | DEFAULT 0 | Valor gasto |
| month | INTEGER | NOT NULL | Mês (1-12) |
| year | INTEGER | NOT NULL | Ano (ex: 2025) |
| createdAt | TIMESTAMP | DEFAULT now() | Data de criação |
| updatedAt | TIMESTAMP | AUTO UPDATE | Data de atualização |

**Constraints:**
```sql
CREATE UNIQUE INDEX idx_budget_unique 
ON budgets(userId, categoryId, month, year);

ALTER TABLE budgets 
ADD CONSTRAINT chk_budget_month 
CHECK (month BETWEEN 1 AND 12);

ALTER TABLE budgets 
ADD CONSTRAINT chk_budget_year 
CHECK (year >= 2000 AND year <= 2100);

ALTER TABLE budgets 
ADD CONSTRAINT chk_budget_amount 
CHECK (amount > 0);
```

**Cálculo de Spent (Trigger):**
```sql
CREATE OR REPLACE FUNCTION update_budget_spent()
RETURNS TRIGGER AS $$
DECLARE
  budget_month INT;
  budget_year INT;
BEGIN
  -- Extrair mês e ano da transação
  budget_month := EXTRACT(MONTH FROM NEW.date);
  budget_year := EXTRACT(YEAR FROM NEW.date);
  
  -- Atualizar budget correspondente
  UPDATE budgets
  SET spent = (
    SELECT COALESCE(SUM(amount), 0)
    FROM transactions
    WHERE userId = NEW.userId
      AND categoryId = NEW.categoryId
      AND type = 'EXPENSE'
      AND EXTRACT(MONTH FROM date) = budget_month
      AND EXTRACT(YEAR FROM date) = budget_year
  )
  WHERE userId = NEW.userId
    AND categoryId = NEW.categoryId
    AND month = budget_month
    AND year = budget_year;
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_budget_spent
AFTER INSERT OR UPDATE OR DELETE ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_budget_spent();
```

**Alert Logic:**
```sql
-- Alertas de orçamento (>= 90%)
SELECT 
  b.id,
  b.userId,
  c.name as category,
  b.amount as budget,
  b.spent,
  (b.spent / b.amount * 100) as percentage
FROM budgets b
JOIN categories c ON b.categoryId = c.id
WHERE b.spent >= (b.amount * 0.9)
  AND b.month = EXTRACT(MONTH FROM CURRENT_DATE)
  AND b.year = EXTRACT(YEAR FROM CURRENT_DATE);
```

---

### 9. AuditLog

**Propósito**: Log de auditoria para rastreamento de ações.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CUID | PRIMARY KEY | Identificador único |
| userId | CUID | FK → User, NULLABLE | Usuário que executou |
| action | STRING | NOT NULL | Ação executada |
| entity | STRING | NOT NULL | Entidade afetada |
| entityId | STRING | NOT NULL | ID da entidade |
| oldValue | JSON | NULLABLE | Valor anterior |
| newValue | JSON | NULLABLE | Novo valor |
| ipAddress | STRING | NULLABLE | IP do cliente |
| userAgent | STRING | NULLABLE | User agent |
| createdAt | TIMESTAMPTZ | DEFAULT now() | **Data do evento** 🔑 |

**TimescaleDB Configuration:**
```sql
-- Converter para hypertable
SELECT create_hypertable(
  'audit_logs',
  'createdAt',
  chunk_time_interval => INTERVAL '1 month',
  if_not_exists => TRUE
);

-- Índices para auditoria
CREATE INDEX idx_audit_user ON audit_logs(userId, createdAt DESC);
CREATE INDEX idx_audit_entity ON audit_logs(entity, entityId, createdAt DESC);
CREATE INDEX idx_audit_action ON audit_logs(action, createdAt DESC);

-- Data retention (manter 2 anos)
SELECT add_retention_policy(
  'audit_logs',
  INTERVAL '2 years'
);

-- Compressão após 3 meses
ALTER TABLE audit_logs SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'userId, entity'
);

SELECT add_compression_policy(
  'audit_logs',
  INTERVAL '3 months'
);
```

**Ações Comuns:**
```
USER_CREATED, USER_LOGIN, USER_LOGOUT, USER_UPDATED
ACCOUNT_CREATED, ACCOUNT_UPDATED, ACCOUNT_DELETED
TRANSACTION_CREATED, TRANSACTION_UPDATED, TRANSACTION_DELETED
CATEGORY_CREATED, CATEGORY_UPDATED, CATEGORY_DELETED
BUDGET_CREATED, BUDGET_UPDATED, BUDGET_DELETED
PASSWORD_RESET_REQUESTED, PASSWORD_RESET_COMPLETED
INVALID_TOKEN, LOGIN_FAILED
```

---

## 🚀 Migration Strategy

### Step 1: Enable TimescaleDB
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
```

### Step 2: Apply Prisma Migrations
```bash
npx prisma migrate dev --name init
```

### Step 3: Convert to Hypertables
```sql
-- Transactions
SELECT create_hypertable(
  'transactions',
  'date',
  chunk_time_interval => INTERVAL '1 month',
  if_not_exists => TRUE,
  migrate_data => TRUE
);

-- Audit Logs
SELECT create_hypertable(
  'audit_logs',
  'createdAt',
  chunk_time_interval => INTERVAL '1 month',
  if_not_exists => TRUE,
  migrate_data => TRUE
);
```

### Step 4: Create Continuous Aggregates
```sql
-- Daily transaction summary
CREATE MATERIALIZED VIEW daily_transaction_summary
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 day', date) AS day,
  userId,
  categoryId,
  type,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount
FROM transactions
GROUP BY day, userId, categoryId, type;

-- Refresh policy
SELECT add_continuous_aggregate_policy(
  'daily_transaction_summary',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour'
);
```

### Step 5: Setup Compression
```sql
-- Transactions (compress after 6 months)
ALTER TABLE transactions SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'userId, type',
  timescaledb.compress_orderby = 'date DESC'
);

SELECT add_compression_policy('transactions', INTERVAL '6 months');

-- Audit logs (compress after 3 months)
ALTER TABLE audit_logs SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'userId, entity'
);

SELECT add_compression_policy('audit_logs', INTERVAL '3 months');
```

### Step 6: Setup Retention Policies
```sql
-- Transactions: keep 7 years
SELECT add_retention_policy('transactions', INTERVAL '7 years');

-- Audit logs: keep 2 years
SELECT add_retention_policy('audit_logs', INTERVAL '2 years');
```

---

## 📈 Performance Considerations

### Partitioning Strategy
- **Transactions**: Monthly chunks (optimal for queries)
- **Audit Logs**: Monthly chunks (log archival pattern)

### Indexing Best Practices
1. **Time-series queries**: Always include date in WHERE clause
2. **User isolation**: Index on (userId, date)
3. **Category analysis**: Index on (categoryId, date)
4. **Composite indexes**: For common filter combinations

### Query Optimization
```sql
-- ❌ BAD: Full table scan
SELECT * FROM transactions WHERE userId = $1;

-- ✅ GOOD: Uses hypertable optimization
SELECT * FROM transactions 
WHERE userId = $1 
  AND date >= now() - INTERVAL '30 days';

-- ✅ BETTER: Use continuous aggregate
SELECT * FROM daily_transaction_summary
WHERE userId = $1
  AND day >= date_trunc('month', now() - INTERVAL '3 months');
```

### Connection Pooling
```typescript
// prisma/client.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

export default prisma;
```

---

## 🔒 Security Considerations

### Row Level Security (Future)
```sql
-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own transactions
CREATE POLICY user_transactions_policy ON transactions
FOR ALL
USING (userId = current_setting('app.user_id')::text);
```

### Sensitive Data Encryption
- **Passwords**: bcrypt hash (cost factor 10)
- **Credit card numbers**: Store only last 4 digits
- **Connection strings**: Environment variables
- **JWT secrets**: Minimum 32 characters

### Audit Requirements
- Log all CREATE, UPDATE, DELETE operations
- Store IP and User Agent
- Immutable logs (append-only)
- Retention: 2 years minimum

---

## 📊 Data Types Reference

| Prisma Type | PostgreSQL Type | TimescaleDB Compatible | Notes |
|-------------|-----------------|------------------------|-------|
| String | VARCHAR | ✅ | Default max length |
| Int | INTEGER | ✅ | 4 bytes |
| BigInt | BIGINT | ✅ | 8 bytes |
| Float | DOUBLE PRECISION | ✅ | Avoid for money |
| Decimal | NUMERIC(15,2) | ✅ | **Use for money** |
| Boolean | BOOLEAN | ✅ | true/false |
| DateTime | TIMESTAMP | ⚠️ | Use TIMESTAMPTZ |
| Json | JSONB | ✅ | Binary JSON |

### Recommended Types for Financial Data
```prisma
model Transaction {
  amount        Decimal       @db.Decimal(15, 2)  // ✅ Precisão financeira
  date          DateTime      @db.Timestamptz     // ✅ Time-series otimizado
  extractData   Json          @db.JsonB           // ✅ Performático
}
```

---

## 🔄 Backup Strategy

### Daily Backups
```bash
#!/bin/bash
# backup-db.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="finance_control"

# Full backup
pg_dump -h localhost -U postgres -Fc $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.dump"

# Compress
gzip "$BACKUP_DIR/backup_$TIMESTAMP.dump"

# Keep last 30 days
find $BACKUP_DIR -name "backup_*.dump.gz" -mtime +30 -delete
```

### Restore Procedure
```bash
# Restore from backup
gunzip backup_20251113_120000.dump.gz
pg_restore -h localhost -U postgres -d finance_control -c backup_20251113_120000.dump
```

---

## 📝 Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-13 | 2.0.0 | Added TimescaleDB integration, continuous aggregates, compression policies |
| 2025-11-13 | 1.0.0 | Initial database schema with Prisma |

---

**🎯 Ready for TimescaleDB!** This schema is optimized for time-series financial data with automatic partitioning, compression, and continuous aggregates.
