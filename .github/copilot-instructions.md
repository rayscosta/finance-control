# Orientações do GitHub Copilot - Finance Control

## Documentation
- Use JSDoc for documenting functions and classes
- Maintain an updated README.md with setup and usage instructions
- Always document environment variables and configuration options
- Include database setup instructions in the docs
- Use English for all documentation
- All documentation must be in the docs/ folder

## General Development Guidelines

### Language and Framework
- Use modern JavaScript/TypeScript (ES2022+)
- Prefer TypeScript for better type safety
- Use async/await instead of chained Promises
- Implement proper error handling with try/catch

### Code Standards

#### Naming
- Use camelCase for variables and functions: `calculateBalance`, `userAccount`
- Use PascalCase for classes and components: `TransactionService`, `AccountManager`
- Use UPPER_CASE for constants: `MAX_TRANSACTION_AMOUNT`, `DEFAULT_CURRENCY`
- Use kebab-case for file names: `transaction-service.js`, `account-manager.ts`
- Always use English for everything, including comments

#### File Structure
```
src/
├── controllers/     # API controllers
├── services/       # Business logic
├── models/         # Data models
├── utils/          # Utilities and helpers
├── middleware/     # Middlewares
├── config/         # Configurations
└── tests/          # Unit and integration tests
```

### Financial Security

#### Sensitive Data
- NEVER log monetary values or banking data in console.log
- Use environment variables for credentials: `process.env.DB_PASSWORD`
- Implement strict validation for monetary values
- Use libraries like `decimal.js` or `big.js` for precise money calculations

#### Input Validation
- Always validate and sanitize input data
- Use validation schemas (Joi, Yup, Zod)
- Implement rate limiting for APIs
- Validate financial data types

### Development Standards

#### Financial Transactions
- Use database transactions for critical operations
- Implement audit logs for all financial operations
- Always use decimal types for monetary values, never float
- Implement automatic rollback on failure

#### Error Handling
```javascript
// Example of proper error handling
try {
  const transaction = await processPayment(amount, account);
  await logTransaction(transaction);
} catch (error) {
  logger.error('Payment processing failed', { 
    error: error.message, 
    accountId: account.id,
    // NUNCA log o valor ou dados sensíveis
  });
  throw new PaymentError('Transaction failed');
}
```

#### APIs e Rotas
- Use verbos HTTP apropriados: GET, POST, PUT, DELETE
- Implemente paginação para listas: `?page=1&limit=10`
- Use códigos de status HTTP corretos
- Implemente autenticação e autorização

### Bibliotecas Recomendadas

#### Essenciais
- `decimal.js` ou `big.js` - Cálculos monetários precisos
- `joi` ou `zod` - Validação de schemas
- `bcrypt` - Hash de senhas
- `jsonwebtoken` - Autenticação JWT

#### Utilitários
- `moment.js` ou `date-fns` - Manipulação de datas
- `lodash` - Utilitários gerais
- `winston` - Logging estruturado

### Performance

#### Otimizações
- Use índices apropriados no banco de dados
- Implemente cache para consultas frequentes
- Use paginação para grandes datasets
- Otimize queries N+1

#### Monitoramento
- Implemente logs estruturados
- Use métricas para operações críticas
- Monitore performance de queries
- Alerte sobre falhas em transações

### Boas Práticas Específicas

1. **Sempre use transações de DB para operações financeiras**
2. **Implemente idempotência em APIs de pagamento**
3. **Use valores absolutos para validação de montantes**
4. **Implemente timeout adequado para APIs externas**
5. **Mantenha logs de auditoria imutáveis**
6. **Use HTTPS em todas as comunicações**
7. **Implemente 2FA para operações sensíveis**
8. **Valide moedas e formatos monetários**

## Git Workflow e Branches

### Estrutura de Branches

```
main (production)
  ↓
develop (integration)
  ↓
feature/* (new features)
bugfix/* (bug fixes)
hotfix/* (urgent production fixes)
```

### Regras de Branches

#### Main Branch
- **Propósito**: Código em produção
- **Proteção**: Apenas merges de `develop` ou `hotfix/*`
- **Deploy**: Automático para produção
- **Nunca**: Commit direto na main

#### Develop Branch
- **Propósito**: Integração de features
- **Base**: Criada a partir de `main`
- **Merges**: Recebe de `feature/*` e `bugfix/*`
- **Deploy**: Ambiente de staging/homologação

#### Feature Branches
- **Nomenclatura**: `feature/nome-da-funcionalidade`
- **Exemplos**: 
  - `feature/timescaledb-integration`
  - `feature/cash-flow-forecast`
  - `feature/multi-currency-support`
- **Base**: Criada a partir de `develop`
- **Merge**: De volta para `develop` via Pull Request

#### Bugfix Branches
- **Nomenclatura**: `bugfix/descricao-do-bug`
- **Exemplos**:
  - `bugfix/login-token-expiration`
  - `bugfix/transaction-calculation-error`
- **Base**: Criada a partir de `develop`
- **Merge**: De volta para `develop` via Pull Request

#### Hotfix Branches
- **Nomenclatura**: `hotfix/descricao-critica`
- **Exemplos**:
  - `hotfix/security-vulnerability`
  - `hotfix/payment-processing-error`
- **Base**: Criada a partir de `main`
- **Merge**: Para `main` E `develop`

### Workflow de Desenvolvimento

#### 1. Iniciar Nova Feature
```bash
# Atualizar develop
git checkout develop
git pull origin develop

# Criar feature branch
git checkout -b feature/nome-da-feature

# Trabalhar na feature
git add .
git commit -m "feat(scope): description"

# Push para remoto
git push origin feature/nome-da-feature
```

#### 2. Finalizar Feature
```bash
# Atualizar com develop
git checkout develop
git pull origin develop
git checkout feature/nome-da-feature
git merge develop

# Resolver conflitos se necessário
# Testar a feature

# Criar Pull Request via GitHub
# Após aprovação, merge para develop
```

#### 3. Hotfix de Produção
```bash
# Criar hotfix da main
git checkout main
git pull origin main
git checkout -b hotfix/descricao

# Corrigir bug
git add .
git commit -m "fix(critical): description"

# Merge para main
git checkout main
git merge hotfix/descricao
git push origin main

# Merge para develop também
git checkout develop
git merge hotfix/descricao
git push origin develop

# Deletar hotfix branch
git branch -d hotfix/descricao
```

### Convenções de Commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

#### Types:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta lógica)
- `refactor`: Refatoração de código
- `perf`: Melhoria de performance
- `test`: Adição/correção de testes
- `chore`: Tarefas de manutenção
- `ci`: Configuração de CI/CD
- `build`: Mudanças no build

#### Scopes (exemplos):
- `auth`: Autenticação
- `transactions`: Transações
- `accounts`: Contas
- `categories`: Categorias
- `import`: Importação
- `db`: Database
- `api`: API endpoints

#### Exemplos:
```bash
feat(timescale): add hypertable for transactions
fix(auth): resolve token expiration issue
docs(readme): update installation instructions
refactor(api): extract validation middleware
perf(db): add index on transaction date
test(transactions): add unit tests for calculations
```

### Pull Request Guidelines

#### Template de PR
```markdown
## Description
[Descreva o que foi feito]

## Type of Change
- [ ] Feature (nova funcionalidade)
- [ ] Bugfix (correção de bug)
- [ ] Hotfix (correção crítica)
- [ ] Refactor (refatoração)
- [ ] Documentation (documentação)

## Testing
- [ ] Testes unitários passando
- [ ] Testes de integração passando
- [ ] Testado manualmente

## Checklist
- [ ] Código segue padrões do projeto
- [ ] Comentários adicionados onde necessário
- [ ] Documentação atualizada
- [ ] Sem console.logs em produção
- [ ] Migrations criadas (se aplicável)
```

#### Revisão de Código
- **Mínimo**: 1 aprovação antes de merge
- **Foco**: Segurança, performance, padrões
- **Testes**: CI deve passar
- **Conflitos**: Resolver antes de merge

### Proteção de Branches

#### Main
```yaml
Protection Rules:
  - Require pull request reviews: 1
  - Require status checks to pass: ✓
  - Require branches to be up to date: ✓
  - Require linear history: ✓
  - No force push: ✓
  - No deletions: ✓
```

#### Develop
```yaml
Protection Rules:
  - Require pull request reviews: 1
  - Require status checks to pass: ✓
  - No force push: ✓
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
on:
  pull_request:
    branches: [develop, main]
  push:
    branches: [develop, main]

jobs:
  test:
    - Run TypeScript compilation
    - Run unit tests
    - Run integration tests
    - Check code coverage (>80%)
    
  lint:
    - ESLint
    - Prettier
    - TypeScript strict mode
    
  security:
    - npm audit
    - Dependency scanning
    - SAST analysis
```

## Lembre-se
- Segurança financeira é PRIORIDADE MÁXIMA
- Sempre teste cálculos monetários extensivamente
- Mantenha logs de auditoria completos
- Use tipos seguros para valores monetários
- Implemente rollback em todas as operações críticas
- **NUNCA commit direto em main ou develop**
- **SEMPRE crie feature branches**
- **SEMPRE faça Pull Requests**
