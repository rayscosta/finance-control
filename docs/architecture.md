# 🏛️ Arquitetura do Sistema

## Visão Geral - Finance Control

```mermaid
graph TB
    subgraph "Frontend - Camada de Apresentação"
        HTML[HTML5 Pages]
        CSS[CSS3 Styles]
        JS[JavaScript ES6+]
        
        HTML --> Pages[Login, Dashboard, Transactions,<br/>Accounts, Categories,<br/>Credit Cards, Budget, Import]
        CSS --> Styles[Auth, Dashboard,<br/>Base Components]
        JS --> Scripts[Auth Manager, API Client,<br/>Dashboard Controller,<br/>Form Handlers]
    end
    
    subgraph "API Gateway"
        Express[Express.js Server]
        
        Middlewares[Middleware Layer]
        Middlewares --> AuthMW[JWT Authentication]
        Middlewares --> ValidMW[Joi Validation]
        Middlewares --> RateMW[Rate Limiting]
        Middlewares --> LogMW[Request Logging]
        Middlewares --> CORS[CORS + Helmet]
    end
    
    subgraph "Backend - Camada de Negócio"
        Controllers[Controllers]
        Controllers --> AuthCtrl[Auth Controller]
        Controllers --> AccCtrl[Account Controller]
        Controllers --> TxnCtrl[Transaction Controller]
        Controllers --> CatCtrl[Category Controller]
        Controllers --> CardCtrl[Credit Card Controller]
        Controllers --> BudgetCtrl[Budget Controller]
        
        Services[Services]
        Services --> UserSvc[User Service]
        Services --> AccSvc[Account Service]
        Services --> TxnSvc[Transaction Service]
        Services --> CatSvc[Category Service]
        Services --> CardSvc[Credit Card Service]
        Services --> BudgetSvc[Budget Service]
    end
    
    subgraph "Data Layer"
        ORM[Prisma ORM]
        DB[(PostgreSQL<br/>Database)]
        
        ORM --> Models[Models/Schemas]
        Models --> User[User]
        Models --> Account[Account]
        Models --> Transaction[Transaction]
        Models --> Category[Category]
        Models --> CreditCard[Credit Card]
        Models --> Budget[Budget]
        Models --> AuditLog[Audit Log]
    end
    
    subgraph "External Services"
        Email[Email Service<br/>Nodemailer]
        Storage[File Storage<br/>Local/S3]
    end
    
    subgraph "Infrastructure"
        Docker[Docker Containers]
        Docker --> AppContainer[Node.js App]
        Docker --> DBContainer[PostgreSQL]
        
        ENV[Environment Config]
        ENV --> DotEnv[.env File]
    end
    
    subgraph "Monitoring & Logging"
        Logger[Winston Logger]
        Logger --> AppLogs[Application Logs]
        Logger --> AuditLogs[Audit Trail]
        Logger --> ErrorLogs[Error Logs]
    end
    
    %% Connections
    Pages --> Express
    Express --> Middlewares
    Middlewares --> Controllers
    Controllers --> Services
    Services --> ORM
    ORM --> DB
    
    Services --> Email
    Services --> Storage
    Services --> Logger
    
    Express --> Docker
    DB --> Docker
    
    ENV --> Express
    ENV --> ORM

    style Frontend fill:#e1f5ff
    style "API Gateway" fill:#fff4e1
    style "Backend - Camada de Negócio" fill:#e8f5e9
    style "Data Layer" fill:#f3e5f5
    style "External Services" fill:#fce4ec
    style Infrastructure fill:#fff3e0
    style "Monitoring & Logging" fill:#e0f2f1
```

## 📊 Arquitetura em Camadas

### 1. 🎨 Frontend Layer

**Tecnologias:**
- HTML5
- CSS3 (com variáveis CSS)
- JavaScript ES6+ (Vanilla)

**Responsabilidades:**
- Interface do usuário
- Validação de formulários
- Gerenciamento de estado local
- Comunicação com API via Fetch
- Armazenamento de tokens (localStorage/sessionStorage)

**Estrutura:**
```
public/
├── *.html          # Páginas do sistema
├── css/            # Estilos
│   ├── auth.css
│   ├── dashboard.css
│   └── base.css
└── js/             # Scripts
    ├── auth.js
    ├── app.js
    ├── dashboard.js
    └── accounts.js
```

**Comunicação:**
- REST API via HTTP/HTTPS
- JSON payload
- JWT Bearer token authentication

---

### 2. 🚪 API Gateway Layer

**Tecnologia:** Express.js

**Responsabilidades:**
- Roteamento de requisições
- Autenticação e autorização
- Validação de entrada
- Rate limiting
- CORS e segurança
- Logging centralizado

**Middlewares:**
```typescript
app.use(helmet());              // Segurança headers
app.use(cors());                // CORS policy
app.use(express.json());        // JSON parser
app.use(rateLimiter);           // Rate limiting
app.use(requestLogger);         // Log requests
```

**Rotas:**
```
/api/auth/*           # Autenticação
/api/accounts/*       # Contas
/api/transactions/*   # Transações
/api/categories/*     # Categorias
/api/credit-cards/*   # Cartões de crédito
/api/budgets/*        # Orçamentos
/api/analytics/*      # Relatórios
```

---

### 3. 🧠 Business Logic Layer

**Tecnologia:** TypeScript + Node.js

**Padrão:** MVC (Model-View-Controller)

#### Controllers
- Recebem requisições HTTP
- Validam schemas com Joi
- Delegam para services
- Formatam respostas JSON

#### Services
- Lógica de negócio
- Validações complexas
- Cálculos e agregações
- Integração com DB via Prisma
- Chamadas a serviços externos

**Separação de Responsabilidades:**
```
Controllers: HTTP → Service
Services: Business Logic → Database
```

---

### 4. 💾 Data Layer

**Tecnologia:** Prisma ORM + PostgreSQL

**Responsabilidades:**
- Persistência de dados
- Migrations e versionamento
- Type-safe queries
- Relacionamentos entre entidades

**Recursos:**
- Migrations automáticas
- Seed de dados iniciais (47 categorias globais)
- Soft delete (flag `isActive`)
- Audit trail completo

**Schema:**
```prisma
User → Account → Transaction
User → Category → Transaction
User → CreditCard → CreditCardBill
User → Budget
```

---

### 5. 🔧 External Services Layer

#### Email Service (Futuro)
- Nodemailer
- Templates de email
- Confirmação de registro
- Reset de senha

#### File Storage
- Upload de anexos (extratos, comprovantes)
- Local filesystem ou S3
- Validação de tipo/tamanho

---

### 6. 🐳 Infrastructure Layer

#### Docker Containers
```yaml
services:
  postgres:    # PostgreSQL database
  app:         # Node.js application
```

#### Environment Configuration
```bash
DATABASE_URL
JWT_SECRET
NODE_ENV
PORT
```

---

### 7. 📊 Monitoring & Logging

**Winston Logger:**
- Níveis: error, warn, info, debug
- Formato JSON estruturado
- Rotação de arquivos
- Logs de auditoria separados

**Métricas Monitoradas:**
- Requisições por endpoint
- Tempo de resposta
- Erros e exceções
- Tentativas de autenticação
- Mudanças em dados críticos

---

## 🔄 Fluxo de Dados

### Request Flow
```
1. User Action (Frontend)
   ↓
2. HTTP Request (Fetch API)
   ↓
3. Express Server (Middleware pipeline)
   ↓
4. Authentication (JWT validation)
   ↓
5. Validation (Joi schemas)
   ↓
6. Controller (HTTP layer)
   ↓
7. Service (Business logic)
   ↓
8. Prisma ORM (Query builder)
   ↓
9. PostgreSQL (Database)
   ↓
10. Response (JSON)
```

### Data Flow
```
Database → Prisma → Service → Controller → JSON → Frontend
```

---

## 🔐 Segurança

### Autenticação
- JWT (JSON Web Tokens)
- Expiração: 7 dias
- Refresh: Manual (novo login)
- Storage: localStorage/sessionStorage

### Autorização
- Middleware `authenticateToken`
- Segregação por userId
- Validação de ownership

### Proteções
- Helmet.js (security headers)
- CORS configurado
- Rate limiting (5 req/min login)
- Input validation (Joi)
- SQL injection (Prisma prepared statements)
- XSS (sanitização de inputs)

### Audit Trail
- Logs de autenticação
- Logs de mudanças
- Tracking de IPs
- Timestamp de todas as ações

---

## 📈 Escalabilidade

### Horizontal Scaling
- Stateless API (JWT)
- Load balancer ready
- Session-less architecture

### Vertical Scaling
- PostgreSQL otimizado
- Índices em queries frequentes
- Connection pooling

### Caching (Futuro)
- Redis para sessões
- Cache de categorias globais
- Cache de estatísticas

---

## 🧪 Testing Strategy

### Camadas de Teste

1. **Unit Tests**
   - Services isolados
   - Funções puras
   - Mocks do Prisma

2. **Integration Tests**
   - Controllers + Services
   - Database in-memory
   - API endpoints

3. **E2E Tests**
   - Fluxos completos
   - UI automation
   - Database real

---

## 🚀 Deployment

### Development
```bash
docker compose -f docker-compose.dev.yml up
```

### Production
```bash
docker compose up -d --build
```

### CI/CD (Futuro)
- GitHub Actions
- Automated tests
- Docker build
- Deploy to cloud

---

## 📦 Dependências Principais

### Backend
- **express**: Web framework
- **prisma**: ORM
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT tokens
- **joi**: Validation
- **winston**: Logging
- **helmet**: Security
- **cors**: CORS handling

### Frontend
- Vanilla JavaScript (sem frameworks)
- Fetch API (requisições)
- LocalStorage (persistência)

### Database
- **PostgreSQL 16**: Database
- **Prisma**: Migrations e queries

### DevOps
- **Docker**: Containerização
- **Docker Compose**: Orquestração
- **TypeScript**: Type safety
- **ts-node**: Development runtime

---

## 🎯 Performance

### Otimizações
- Índices no banco de dados
- Queries otimizadas (eager/lazy loading)
- Conexão pooling
- Compressão de responses
- Static file caching

### Métricas
- Response time < 200ms (média)
- Uptime > 99.9%
- Zero downtime deploys (futuro)

---

## 🔮 Roadmap

### Próximas Features
1. Redis caching
2. Email service completo
3. Notificações push
4. Mobile app (React Native)
5. Integração bancária (Open Banking)
6. IA para categorização automática
7. Exportação de relatórios (PDF/Excel)
8. Multi-moeda
9. Compartilhamento de orçamentos
10. API pública com rate limiting

---

## 📚 Documentação Relacionada

- [Entity Relationship Diagram](./entity-relationship.md)
- [Class Diagram](./class-diagram.md)
- [Sequence Diagrams](./sequence-diagrams.md)
- [User Module Instructions](../.github/copilot-instructions-user.md)
- [Main README](../README.md)
