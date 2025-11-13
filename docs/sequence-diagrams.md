# 🔄 Diagramas de Sequência

## Principais Fluxos do Finance Control

### 1. 🔐 Fluxo de Autenticação - Login

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant AuthController
    participant UserService
    participant Prisma
    participant DB as PostgreSQL
    participant AuditLog
    
    User->>Frontend: Preenche email/senha
    Frontend->>Frontend: Valida campos
    Frontend->>AuthController: POST /api/auth/login
    
    AuthController->>AuthController: Valida schema Joi
    AuthController->>UserService: loginUser(email, password)
    
    UserService->>Prisma: findUnique({ email })
    Prisma->>DB: SELECT * FROM users WHERE email = ?
    DB-->>Prisma: User data
    Prisma-->>UserService: User object
    
    alt User não encontrado
        UserService-->>AuthController: throw Error("Credenciais inválidas")
        AuthController-->>Frontend: 401 Unauthorized
        Frontend-->>User: Exibe erro
    else User encontrado
        UserService->>UserService: bcrypt.compare(password, hash)
        
        alt Senha incorreta
            UserService-->>AuthController: throw Error("Credenciais inválidas")
            AuthController-->>Frontend: 401 Unauthorized
            Frontend-->>User: Exibe erro
        else Senha correta
            UserService->>UserService: jwt.sign({ userId, email })
            UserService->>AuditLog: log("USER_LOGIN", userId)
            
            UserService-->>AuthController: { user, token }
            AuthController-->>Frontend: 200 OK + { user, token }
            
            Frontend->>Frontend: localStorage.setItem('authToken', token)
            Frontend->>Frontend: Redireciona para /dashboard.html
            Frontend-->>User: Dashboard carregado
        end
    end
```

### 2. 📝 Fluxo de Registro

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant AuthController
    participant UserService
    participant Prisma
    participant DB
    
    User->>Frontend: Preenche nome/email/senha
    Frontend->>AuthController: POST /api/auth/register
    
    AuthController->>AuthController: Valida schema Joi
    AuthController->>UserService: createUser(data)
    
    UserService->>Prisma: findUnique({ email })
    Prisma->>DB: SELECT * WHERE email = ?
    DB-->>Prisma: null (não existe)
    
    alt Email já existe
        Prisma-->>UserService: User object
        UserService-->>AuthController: throw Error("Email já cadastrado")
        AuthController-->>Frontend: 400 Bad Request
        Frontend-->>User: Exibe erro
    else Email disponível
        UserService->>UserService: bcrypt.hash(password, 10)
        UserService->>Prisma: create({ name, email, hashedPassword })
        Prisma->>DB: INSERT INTO users
        DB-->>Prisma: User created
        
        UserService->>UserService: jwt.sign({ userId, email })
        UserService-->>AuthController: { user, token }
        
        AuthController-->>Frontend: 201 Created + { user, token }
        Frontend->>Frontend: localStorage.setItem('authToken')
        Frontend-->>User: Redireciona para dashboard
    end
```

### 3. 💸 Fluxo de Criação de Transação

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant AuthMiddleware
    participant TransactionController
    participant TransactionService
    participant AccountService
    participant Prisma
    participant DB
    
    User->>Frontend: Preenche formulário de transação
    Frontend->>TransactionController: POST /api/transactions
    Note over Frontend,TransactionController: Headers: Authorization: Bearer <token>
    
    TransactionController->>AuthMiddleware: authenticateToken()
    AuthMiddleware->>AuthMiddleware: jwt.verify(token)
    
    alt Token inválido
        AuthMiddleware-->>Frontend: 401 Unauthorized
        Frontend-->>User: Redireciona para login
    else Token válido
        AuthMiddleware->>TransactionController: req.user = { userId }
        
        TransactionController->>TransactionController: Valida schema
        TransactionController->>TransactionService: createTransaction(userId, data)
        
        TransactionService->>Prisma: Verifica accountId do userId
        Prisma->>DB: SELECT * FROM accounts WHERE id = ? AND userId = ?
        
        alt Conta não pertence ao usuário
            DB-->>Prisma: null
            Prisma-->>TransactionService: null
            TransactionService-->>TransactionController: throw Error("Conta não encontrada")
            TransactionController-->>Frontend: 404 Not Found
        else Conta válida
            DB-->>Prisma: Account object
            
            TransactionService->>Prisma: transaction (BEGIN)
            
            TransactionService->>Prisma: create Transaction
            Prisma->>DB: INSERT INTO transactions
            DB-->>Prisma: Transaction created
            
            TransactionService->>AccountService: updateBalance(accountId, amount, type)
            AccountService->>Prisma: update Account balance
            Prisma->>DB: UPDATE accounts SET balance = ?
            DB-->>Prisma: Account updated
            
            TransactionService->>Prisma: transaction (COMMIT)
            
            TransactionService-->>TransactionController: Transaction object
            TransactionController-->>Frontend: 201 Created + transaction
            
            Frontend->>Frontend: Atualiza lista de transações
            Frontend->>Frontend: Atualiza saldo da conta
            Frontend-->>User: Exibe sucesso
        end
    end
```

### 4. 📊 Fluxo de Dashboard - Carregamento de Dados

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant Dashboard.js
    participant AuthAPI as /api/auth/me
    participant TransactionsAPI as /api/transactions
    participant AccountsAPI as /api/accounts
    participant AnalyticsAPI as /api/analytics
    
    User->>Browser: Acessa /dashboard.html
    Browser->>Browser: Carrega HTML/CSS/JS
    
    Browser->>Dashboard.js: DOMContentLoaded
    Dashboard.js->>Dashboard.js: checkAuth()
    
    par Requisições Paralelas
        Dashboard.js->>AuthAPI: GET /api/auth/me
        and
        Dashboard.js->>TransactionsAPI: GET /api/transactions/stats
        and
        Dashboard.js->>AccountsAPI: GET /api/accounts
        and
        Dashboard.js->>TransactionsAPI: GET /api/transactions?limit=5
        and
        Dashboard.js->>AnalyticsAPI: GET /api/analytics/health-score
    end
    
    AuthAPI-->>Dashboard.js: User data
    Dashboard.js->>Dashboard.js: Atualiza menu: nome e email
    
    TransactionsAPI-->>Dashboard.js: Stats: receitas, despesas
    Dashboard.js->>Dashboard.js: Renderiza cards de resumo
    
    AccountsAPI-->>Dashboard.js: Lista de contas
    Dashboard.js->>Dashboard.js: Renderiza widget de contas
    
    TransactionsAPI-->>Dashboard.js: Últimas 5 transações
    Dashboard.js->>Dashboard.js: Renderiza tabela de transações
    
    AnalyticsAPI-->>Dashboard.js: Health score: 75%
    Dashboard.js->>Dashboard.js: Renderiza gráfico de saúde
    
    Dashboard.js-->>Browser: Dashboard completo
    Browser-->>User: Visualiza dashboard
```

### 5. 💳 Fluxo de Fechamento de Fatura de Cartão

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant CreditCardController
    participant CreditCardService
    participant Prisma
    participant DB
    
    User->>Frontend: Clica "Fechar Fatura"
    Frontend->>CreditCardController: POST /api/credit-cards/:id/bills/:billId/close
    
    CreditCardController->>CreditCardService: closeBill(billId, userId)
    
    CreditCardService->>Prisma: findUnique Bill
    Prisma->>DB: SELECT * FROM bills WHERE id = ?
    DB-->>Prisma: Bill data
    
    alt Bill não encontrada
        Prisma-->>CreditCardService: null
        CreditCardService-->>Frontend: 404 Not Found
    else Bill encontrada
        CreditCardService->>Prisma: findMany CreditCardTransactions
        Prisma->>DB: SELECT * WHERE billId = ?
        DB-->>Prisma: Transactions array
        
        CreditCardService->>CreditCardService: totalAmount = sum(transactions)
        
        CreditCardService->>Prisma: transaction (BEGIN)
        
        CreditCardService->>Prisma: update Bill (status=CLOSED, totalAmount)
        Prisma->>DB: UPDATE bills SET status='CLOSED'
        
        CreditCardService->>Prisma: create next Bill
        Prisma->>DB: INSERT INTO bills (nextMonth)
        
        CreditCardService->>Prisma: transaction (COMMIT)
        
        CreditCardService-->>CreditCardController: Closed bill
        CreditCardController-->>Frontend: 200 OK + bill
        
        Frontend->>Frontend: Atualiza lista de faturas
        Frontend-->>User: "Fatura fechada: R$ X,XX"
    end
```

### 6. 🔄 Fluxo de Importação de Extrato (OFX/CSV)

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant ImportController
    participant ImportService
    participant Parser as OFX/CSV Parser
    participant TransactionService
    participant Prisma
    participant DB
    
    User->>Frontend: Seleciona arquivo OFX/CSV
    User->>Frontend: Clica "Importar"
    
    Frontend->>ImportController: POST /api/import (multipart/form-data)
    Note over Frontend,ImportController: File + accountId
    
    ImportController->>ImportController: Valida arquivo (tamanho, tipo)
    
    alt Arquivo inválido
        ImportController-->>Frontend: 400 Bad Request
        Frontend-->>User: "Arquivo inválido"
    else Arquivo válido
        ImportController->>ImportService: importTransactions(file, accountId, userId)
        
        ImportService->>Parser: parse(file)
        Parser->>Parser: Detecta formato (OFX vs CSV)
        Parser->>Parser: Extrai transações
        Parser-->>ImportService: Array de transações
        
        loop Para cada transação
            ImportService->>ImportService: Valida dados
            ImportService->>ImportService: Verifica duplicata (hash)
            
            alt Já existe
                ImportService->>ImportService: Skip transaction
            else Nova transação
                ImportService->>TransactionService: createTransaction(data)
                TransactionService->>Prisma: create
                Prisma->>DB: INSERT INTO transactions
            end
        end
        
        ImportService-->>ImportController: { imported: N, skipped: M }
        ImportController-->>Frontend: 200 OK + summary
        
        Frontend->>Frontend: Atualiza lista de transações
        Frontend-->>User: "Importadas: N, Ignoradas: M"
    end
```

## 🔍 Notas sobre os Diagramas

### Padrões Comuns

1. **Autenticação**: Todas as rotas protegidas passam pelo `AuthMiddleware`
2. **Validação**: Controllers validam schemas antes de chamar services
3. **Transações DB**: Operações críticas usam Prisma transactions
4. **Audit Log**: Ações importantes são auditadas
5. **Error Handling**: Erros são capturados e retornados com status HTTP apropriado

### Otimizações

- **Requisições Paralelas**: Dashboard faz múltiplas chamadas em paralelo
- **Lazy Loading**: Dados são carregados sob demanda
- **Caching**: Token JWT evita consultas repetidas ao DB
- **Bulk Operations**: Importações processam lotes de transações

### Segurança

- **Token Validation**: Toda requisição autenticada valida JWT
- **User Isolation**: Queries sempre filtram por `userId`
- **Input Validation**: Joi valida todos os inputs
- **SQL Injection**: Prisma previne com prepared statements
