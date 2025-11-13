# 🗄️ Diagrama Entidade-Relacionamento (ERD)

## Banco de Dados - Finance Control

```mermaid
erDiagram
    User ||--o{ Account : "possui"
    User ||--o{ Category : "cria"
    User ||--o{ Transaction : "registra"
    User ||--o{ CreditCard : "possui"
    User ||--o{ Budget : "define"
    
    Account ||--o{ Transaction : "contém"
    
    Category ||--o{ Transaction : "classifica"
    Category ||--o{ Budget : "associa"
    
    CreditCard ||--o{ CreditCardTransaction : "gera"
    CreditCard ||--o{ CreditCardBill : "possui"
    
    CreditCardBill ||--o{ CreditCardTransaction : "agrupa"
    
    Transaction ||--o| CreditCardTransaction : "pode ser"
    
    User {
        string id PK "cuid"
        string email UK "unique"
        string password "bcrypt hash"
        string name
        datetime createdAt
        datetime updatedAt
        string passwordResetToken "nullable"
        datetime passwordResetExpires "nullable"
    }
    
    Account {
        string id PK "cuid"
        string userId FK
        string name
        string type "CHECKING, SAVINGS, INVESTMENT, CASH"
        decimal balance "Decimal"
        string currency "default BRL"
        string bankName "nullable"
        string accountNumber "nullable"
        boolean isActive "default true"
        datetime createdAt
        datetime updatedAt
    }
    
    Category {
        string id PK "cuid"
        string userId FK "nullable for global"
        string name
        string type "INCOME, EXPENSE"
        string color
        string icon
        boolean isGlobal "default false"
        boolean isActive "default true"
        datetime createdAt
        datetime updatedAt
    }
    
    Transaction {
        string id PK "cuid"
        string userId FK
        string accountId FK
        string categoryId FK
        string type "INCOME, EXPENSE, TRANSFER"
        decimal amount "Decimal"
        string description "nullable"
        date date
        string recurring "nullable"
        string recurringType "NONE, DAILY, WEEKLY, MONTHLY, YEARLY"
        string recurringEndDate "nullable"
        string attachmentUrl "nullable"
        string notes "nullable"
        datetime createdAt
        datetime updatedAt
    }
    
    CreditCard {
        string id PK "cuid"
        string userId FK
        string name
        string lastFourDigits "4 digits"
        decimal creditLimit "Decimal"
        decimal availableLimit "Decimal"
        int closingDay "1-31"
        int dueDay "1-31"
        string brand "nullable"
        boolean isActive "default true"
        datetime createdAt
        datetime updatedAt
    }
    
    CreditCardTransaction {
        string id PK "cuid"
        string creditCardId FK
        string billId FK "nullable"
        string transactionId FK "nullable"
        decimal amount "Decimal"
        string description
        date purchaseDate
        int installments "default 1"
        int currentInstallment "default 1"
        string category "nullable"
        string status "PENDING, PAID, CANCELLED"
        datetime createdAt
        datetime updatedAt
    }
    
    CreditCardBill {
        string id PK "cuid"
        string creditCardId FK
        date closingDate
        date dueDate
        decimal totalAmount "Decimal"
        decimal paidAmount "Decimal default 0"
        string status "OPEN, CLOSED, PAID, OVERDUE"
        datetime createdAt
        datetime updatedAt
    }
    
    Budget {
        string id PK "cuid"
        string userId FK
        string categoryId FK "nullable"
        string name
        decimal amount "Decimal"
        string period "MONTHLY, YEARLY"
        date startDate
        date endDate "nullable"
        boolean isActive "default true"
        datetime createdAt
        datetime updatedAt
    }
    
    AuditLog {
        string id PK "cuid"
        string userId "nullable"
        string action "enum"
        string entityType "nullable"
        string entityId "nullable"
        string changes "json nullable"
        string ipAddress "nullable"
        string userAgent "nullable"
        boolean success "default true"
        string errorMessage "nullable"
        datetime timestamp
    }
```

## 📝 Descrição das Entidades

### 👤 User
Usuários do sistema com autenticação JWT.

**Relacionamentos:**
- 1 usuário → N contas (accounts)
- 1 usuário → N categorias personalizadas (categories)
- 1 usuário → N transações (transactions)
- 1 usuário → N cartões de crédito (credit cards)
- 1 usuário → N orçamentos (budgets)

### 💰 Account
Contas bancárias/financeiras do usuário.

**Tipos:** Conta Corrente, Poupança, Investimento, Dinheiro

**Relacionamentos:**
- N contas → 1 usuário
- 1 conta → N transações

### 🏷️ Category
Categorias para classificação de transações.

**Sistema Híbrido:**
- 47 categorias globais (`isGlobal=true`, `userId=null`)
- Categorias personalizadas por usuário (`isGlobal=false`, `userId=<id>`)

**Tipos:** Receita (INCOME), Despesa (EXPENSE)

**Relacionamentos:**
- N categorias → 1 usuário (ou null para globais)
- 1 categoria → N transações
- 1 categoria → N orçamentos

### 💸 Transaction
Transações financeiras (receitas, despesas, transferências).

**Tipos:** INCOME, EXPENSE, TRANSFER

**Recursos:**
- Transações recorrentes
- Anexos
- Notas
- Vinculação com cartão de crédito

**Relacionamentos:**
- N transações → 1 usuário
- N transações → 1 conta
- N transações → 1 categoria
- 1 transação → 1 transação de cartão (opcional)

### 💳 CreditCard
Cartões de crédito do usuário.

**Recursos:**
- Limite de crédito
- Dias de fechamento e vencimento
- Controle de limite disponível

**Relacionamentos:**
- N cartões → 1 usuário
- 1 cartão → N transações de cartão
- 1 cartão → N faturas

### 🧾 CreditCardTransaction
Compras realizadas no cartão de crédito.

**Recursos:**
- Parcelamento
- Status (pendente, pago, cancelado)
- Vinculação com transação bancária

**Relacionamentos:**
- N transações de cartão → 1 cartão
- N transações de cartão → 1 fatura (quando fechada)
- 1 transação de cartão → 1 transação (opcional)

### 📄 CreditCardBill
Faturas mensais do cartão de crédito.

**Status:** OPEN, CLOSED, PAID, OVERDUE

**Relacionamentos:**
- N faturas → 1 cartão
- 1 fatura → N transações de cartão

### 🎯 Budget
Orçamentos por categoria ou geral.

**Períodos:** Mensal, Anual

**Relacionamentos:**
- N orçamentos → 1 usuário
- N orçamentos → 1 categoria (opcional)

### 📋 AuditLog
Logs de auditoria de todas as ações importantes.

**Eventos Auditados:**
- Autenticação (login, logout, falhas)
- CRUD de entidades
- Alterações críticas
- Tentativas de acesso não autorizado

## 🔑 Regras de Integridade

### Constraints
- Email único por usuário
- Categorias globais sem userId
- Transações sempre vinculadas a usuário, conta e categoria
- Cartões com dias válidos (1-31)
- Faturas com status consistente
- Limites de cartão >= limite disponível

### Índices
- `User.email` (unique)
- `Transaction.userId, date` (composite)
- `Category.userId, isGlobal` (composite)
- `CreditCardBill.creditCardId, status` (composite)
- `AuditLog.userId, timestamp` (composite)

### Soft Delete
Entidades principais usam flag `isActive` ao invés de deleção física:
- Account
- Category (user-created)
- CreditCard
- Budget

## 📊 Cardinalidade

| Relacionamento | Tipo | Descrição |
|----------------|------|-----------|
| User → Account | 1:N | Um usuário possui várias contas |
| User → Category | 1:N | Um usuário cria várias categorias |
| User → Transaction | 1:N | Um usuário registra várias transações |
| User → CreditCard | 1:N | Um usuário possui vários cartões |
| User → Budget | 1:N | Um usuário define vários orçamentos |
| Account → Transaction | 1:N | Uma conta contém várias transações |
| Category → Transaction | 1:N | Uma categoria classifica várias transações |
| Category → Budget | 1:N | Uma categoria associa-se a vários orçamentos |
| CreditCard → CreditCardTransaction | 1:N | Um cartão gera várias transações |
| CreditCard → CreditCardBill | 1:N | Um cartão possui várias faturas |
| CreditCardBill → CreditCardTransaction | 1:N | Uma fatura agrupa várias transações |
| Transaction → CreditCardTransaction | 1:1 | Relação opcional (apenas para compras no cartão) |

## 🗂️ Segregação de Dados

Todos os dados são segregados por usuário (`userId` como FK), garantindo:
- ✅ Isolamento completo entre usuários
- ✅ Queries eficientes com filtro por userId
- ✅ Segurança: um usuário não acessa dados de outro
- ✅ LGPD compliance: fácil exclusão de todos os dados de um usuário

## 🔐 Segurança

- Senhas: Hash bcrypt (10+ rounds)
- Tokens: JWT com expiração de 7 dias
- Audit Trail: Todas as ações importantes logadas
- Soft Delete: Preserva histórico para auditoria
- Constraints: Garantem integridade referencial
