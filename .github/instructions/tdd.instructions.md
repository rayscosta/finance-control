````instructions
# Test-Driven Development (TDD) - Finance Control

## 📋 Visão Geral

A partir de agora, **TODO o desenvolvimento** no Finance Control será guiado por testes. Esta abordagem garante:
- ✅ Código testado desde o início
- ✅ Menos bugs em produção
- ✅ Refatoração segura
- ✅ Documentação viva (os testes descrevem o comportamento)
- ✅ Prevenção de loops infinitos e problemas críticos

---

## 🔴🟢🔵 Ciclo TDD (Red-Green-Refactor)

### 1. 🔴 RED - Escrever Teste que Falha

Antes de escrever qualquer código, escreva um teste que **descreve o comportamento desejado** e que **falha** porque a funcionalidade ainda não existe.

**Exemplo:**
```typescript
// tests/unit/auth/login.test.ts
describe('AuthService - Login', () => {
  it('deve retornar token JWT válido para credenciais corretas', async () => {
    const email = 'test@example.com';
    const password = 'senha123';
    
    const result = await authService.login(email, password);
    
    expect(result).toHaveProperty('token');
    expect(result.token).toMatch(/^eyJ/); // JWT começa com eyJ
    expect(result.user.email).toBe(email);
  });
});
```

Execute o teste: `npm test` → ❌ **DEVE FALHAR**

### 2. 🟢 GREEN - Implementar Código Mínimo

Escreva **apenas o código necessário** para fazer o teste passar. Não se preocupe com perfeição ainda.

**Exemplo:**
```typescript
// src/services/auth-service.ts
async login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Usuário não encontrado');
  
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error('Senha incorreta');
  
  const token = jwt.sign({ userId: user.id }, config.jwtSecret);
  return { token, user: { id: user.id, email: user.email } };
}
```

Execute o teste: `npm test` → ✅ **DEVE PASSAR**

### 3. 🔵 REFACTOR - Melhorar o Código

Agora que o teste passa, melhore o código:
- Extrair constantes
- Remover duplicação
- Melhorar nomes
- Otimizar performance

Execute o teste novamente: `npm test` → ✅ **DEVE CONTINUAR PASSANDO**

---

## 📁 Estrutura de Testes

```
tests/
├── unit/                      # Testes unitários (funções isoladas)
│   ├── auth/
│   │   ├── login.test.ts
│   │   ├── register.test.ts
│   │   ├── token-validation.test.ts
│   │   └── password-reset.test.ts
│   ├── services/
│   │   ├── account-service.test.ts
│   │   ├── transaction-service.test.ts
│   │   └── category-service.test.ts
│   └── utils/
│       ├── validation.test.ts
│       └── logger.test.ts
│
├── integration/               # Testes de integração (APIs + DB)
│   ├── auth/
│   │   ├── auth-routes.test.ts
│   │   └── auth-middleware.test.ts
│   ├── accounts/
│   │   └── account-routes.test.ts
│   └── transactions/
│       └── transaction-routes.test.ts
│
├── e2e/                       # Testes end-to-end (fluxo completo)
│   ├── auth-flow.test.ts      # Login → Dashboard → Logout
│   ├── transaction-flow.test.ts
│   └── import-flow.test.ts
│
└── fixtures/                  # Dados de teste reutilizáveis
    ├── users.ts
    ├── accounts.ts
    └── transactions.ts
```

---

## 🧪 Tipos de Testes

### 1. Testes Unitários (Unit Tests)

**Objetivo:** Testar funções/métodos isoladamente.

**Quando usar:**
- Testar lógica de negócio pura
- Validação de entrada
- Cálculos e transformações
- Utilitários

**Exemplo:**
```typescript
// tests/unit/utils/validation.test.ts
describe('validateEmail', () => {
  it('deve retornar true para email válido', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });
  
  it('deve retornar false para email sem @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });
  
  it('deve retornar false para email vazio', () => {
    expect(validateEmail('')).toBe(false);
  });
});
```

**Características:**
- ⚡ Rápidos (milissegundos)
- 🔒 Isolados (sem DB, sem APIs externas)
- 🎯 Focados (uma função por teste)

### 2. Testes de Integração (Integration Tests)

**Objetivo:** Testar interação entre componentes (Controller + Service + DB).

**Quando usar:**
- Testar rotas da API
- Testar persistência no banco
- Testar middleware
- Testar autenticação/autorização

**Exemplo:**
```typescript
// tests/integration/auth/auth-routes.test.ts
describe('POST /api/auth/login', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await seedTestUser({
      email: 'test@example.com',
      password: 'senha123'
    });
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  it('deve retornar 200 e token para credenciais válidas', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'senha123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
  
  it('deve retornar 401 para senha incorreta', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'senhaErrada'
      });
    
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});
```

**Características:**
- 🐢 Mais lentos (segundos)
- 🗄️ Usam banco de dados de teste
- 🔗 Testam múltiplos componentes

### 3. Testes End-to-End (E2E Tests)

**Objetivo:** Testar fluxo completo do usuário (frontend + backend).

**Quando usar:**
- Testar jornadas completas
- Validar UI + API + DB
- Testar fluxos críticos (login, pagamento, etc.)

**Exemplo:**
```typescript
// tests/e2e/auth-flow.test.ts
describe('Fluxo de Autenticação Completo', () => {
  it('usuário deve conseguir fazer login e logout', async () => {
    // 1. Visitar página de login
    await page.goto('http://localhost:3000/login.html');
    
    // 2. Preencher formulário
    await page.fill('#login-email', 'test@example.com');
    await page.fill('#login-password', 'senha123');
    await page.click('button[type="submit"]');
    
    // 3. Verificar redirecionamento para dashboard
    await page.waitForURL('**/dashboard.html');
    expect(page.url()).toContain('/dashboard.html');
    
    // 4. Verificar que token foi salvo
    const token = await page.evaluate(() => {
      return localStorage.getItem('authToken');
    });
    expect(token).toBeTruthy();
    
    // 5. Fazer logout
    await page.click('button:has-text("Sair")');
    
    // 6. Verificar redirecionamento para login
    await page.waitForURL('**/login.html');
    expect(page.url()).toContain('/login.html');
    
    // 7. Verificar que token foi removido
    const tokenAfterLogout = await page.evaluate(() => {
      return localStorage.getItem('authToken');
    });
    expect(tokenAfterLogout).toBeNull();
  });
});
```

**Características:**
- 🐌 Lentos (minutos)
- 🌐 Usam navegador real (Playwright/Cypress)
- 💰 Custosos (poucos testes, mas críticos)

---

## 🎯 Regras de Ouro do TDD

### 1. **NUNCA escreva código de produção sem teste que falhe**
❌ **ERRADO:**
```typescript
// Escreveu código direto
function calculateDiscount(price: number): number {
  return price * 0.1;
}
```

✅ **CORRETO:**
```typescript
// 1. Escreveu teste PRIMEIRO
it('deve calcular 10% de desconto', () => {
  expect(calculateDiscount(100)).toBe(10);
});

// 2. Código só depois
function calculateDiscount(price: number): number {
  return price * 0.1;
}
```

### 2. **Escreva apenas código suficiente para passar no teste**
Não adicione funcionalidades "porque pode ser útil no futuro" (YAGNI - You Aren't Gonna Need It).

### 3. **Um teste deve testar apenas UMA coisa**
❌ **ERRADO:**
```typescript
it('deve fazer login e criar conta e resetar senha', async () => {
  // Testa 3 coisas diferentes
});
```

✅ **CORRETO:**
```typescript
it('deve fazer login com credenciais válidas', async () => {});
it('deve criar nova conta', async () => {});
it('deve resetar senha', async () => {});
```

### 4. **Testes devem ser independentes**
Um teste NÃO deve depender de outro. Cada teste deve poder rodar sozinho.

### 5. **Testes devem ser rápidos**
- Unit tests: < 100ms
- Integration tests: < 1s
- E2E tests: < 30s

### 6. **Testes devem ser determinísticos**
Rodar o mesmo teste 100 vezes deve dar o mesmo resultado. Evite:
- Datas dinâmicas (`new Date()`)
- Números aleatórios (`Math.random()`)
- Dependências externas instáveis

### 7. **Use AAA Pattern (Arrange-Act-Assert)**
```typescript
it('deve somar dois números', () => {
  // Arrange (Preparar)
  const a = 2;
  const b = 3;
  
  // Act (Agir)
  const result = sum(a, b);
  
  // Assert (Verificar)
  expect(result).toBe(5);
});
```

---

## 🛠️ Ferramentas de Teste

### Jest (Test Runner)
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e"
  }
}
```

### Supertest (Testes de API)
```typescript
import request from 'supertest';
import app from '../src/app';

const response = await request(app)
  .post('/api/auth/login')
  .send({ email, password });
```

### Playwright (Testes E2E)
```typescript
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('http://localhost:3000/login.html');
  // ...
});
```

---

## 📊 Cobertura de Testes (Coverage)

### Metas de Cobertura

| Tipo de Código | Meta Mínima | Meta Ideal |
|----------------|-------------|------------|
| **Autenticação** | 90% | 100% |
| **Transações Financeiras** | 90% | 100% |
| **Validações** | 80% | 95% |
| **Utilitários** | 70% | 90% |
| **Controllers** | 75% | 85% |
| **Services** | 80% | 90% |

### Comandos
```bash
# Gerar relatório de cobertura
npm run test:coverage

# Ver relatório HTML
open coverage/lcov-report/index.html
```

### Métricas Importantes
- **Lines**: % de linhas executadas
- **Functions**: % de funções chamadas
- **Branches**: % de ramificações (if/else) testadas
- **Statements**: % de declarações executadas

---

## 🚨 Casos de Teste Críticos para Autenticação

### ✅ Login
```typescript
describe('POST /api/auth/login', () => {
  it('✅ deve retornar 200 e token para credenciais válidas');
  it('❌ deve retornar 401 para senha incorreta');
  it('❌ deve retornar 401 para email não cadastrado');
  it('❌ deve retornar 400 para email inválido');
  it('❌ deve retornar 400 para campos vazios');
  it('🔒 deve criar log de auditoria em login bem-sucedido');
  it('🔒 deve criar log de auditoria em login falhado');
  it('⏱️ deve respeitar rate limiting (máx 5 tentativas/15min)');
});
```

### ✅ Registro
```typescript
describe('POST /api/auth/register', () => {
  it('✅ deve retornar 201 e token para dados válidos');
  it('❌ deve retornar 400 para email já cadastrado');
  it('❌ deve retornar 400 para senha curta (< 6 chars)');
  it('❌ deve retornar 400 para email inválido');
  it('❌ deve retornar 400 para nome vazio');
  it('🔒 deve hashear senha antes de salvar');
  it('🔒 deve criar categorias globais para novo usuário');
});
```

### ✅ Token JWT
```typescript
describe('authenticateToken middleware', () => {
  it('✅ deve permitir acesso com token válido');
  it('❌ deve retornar 401 para token expirado');
  it('❌ deve retornar 401 para token inválido');
  it('❌ deve retornar 401 sem header Authorization');
  it('❌ deve retornar 401 para token malformado');
  it('🔒 deve anexar userId ao req.user');
});
```

### ✅ Frontend Auth
```typescript
describe('AuthManager', () => {
  it('✅ deve salvar token no localStorage quando rememberMe=true');
  it('✅ deve salvar token no sessionStorage quando rememberMe=false');
  it('✅ deve redirecionar para dashboard após login');
  it('✅ deve redirecionar para login se não autenticado em página protegida');
  it('❌ NÃO deve causar loop infinito de redirects');
  it('🔒 deve limpar tokens ao fazer logout');
  it('🔒 deve incluir token em todas as requisições autenticadas');
});
```

---

## 🔧 Setup de Banco de Dados de Teste

### Usar SQLite para Testes (mais rápido)
```typescript
// tests/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db' // SQLite em memória
    }
  }
});

export async function setupTestDatabase() {
  await prisma.$executeRaw`PRAGMA foreign_keys = ON`;
  // Rodar migrations
  await prisma.$executeRaw`...`;
}

export async function cleanupTestDatabase() {
  await prisma.user.deleteMany();
  await prisma.account.deleteMany();
  await prisma.transaction.deleteMany();
}

export { prisma };
```

### Fixtures Reutilizáveis
```typescript
// tests/fixtures/users.ts
export const testUsers = {
  validUser: {
    name: 'Test User',
    email: 'test@example.com',
    password: 'senha123'
  },
  adminUser: {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'admin123'
  }
};

export async function createTestUser(data = testUsers.validUser) {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: { ...data, password: hashedPassword }
  });
}
```

---

## 📝 Nomenclatura de Testes

### Padrão: `should/deve + ação + contexto`

✅ **BOM:**
```typescript
it('deve retornar 200 para credenciais válidas')
it('deve lançar erro quando usuário não existe')
it('deve criar transação com categoria padrão')
```

❌ **RUIM:**
```typescript
it('teste de login')
it('funciona')
it('test1')
```

### Padrão BDD (Given-When-Then)
```typescript
describe('Login de usuário', () => {
  describe('Dado que o usuário existe', () => {
    describe('Quando fornece credenciais corretas', () => {
      it('Então deve retornar token JWT');
      it('Então deve criar log de auditoria');
    });
    
    describe('Quando fornece senha incorreta', () => {
      it('Então deve retornar erro 401');
      it('Então deve registrar tentativa falhada');
    });
  });
});
```

---

## 🐛 Debugging de Testes

### Rodar teste específico
```bash
# Por arquivo
npm test auth-routes.test.ts

# Por describe
npm test -t "POST /api/auth/login"

# Por it específico
npm test -t "deve retornar 200 para credenciais válidas"
```

### Debug mode
```json
{
  "scripts": {
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

### Logs no teste
```typescript
it('teste com logs', () => {
  console.log('Valor:', valor); // Aparece no terminal
  expect(valor).toBe(10);
});
```

---

## 📚 Recursos de Aprendizado

### Documentação
- [Jest](https://jestjs.io/docs/getting-started)
- [Supertest](https://github.com/visionmedia/supertest)
- [Playwright](https://playwright.dev/)
- [Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

### Livros
- "Test-Driven Development by Example" - Kent Beck
- "Growing Object-Oriented Software, Guided by Tests" - Steve Freeman

---

## ✅ Checklist de TDD

Antes de fazer commit, verifique:

- [ ] Todos os testes estão passando (`npm test`)
- [ ] Cobertura de testes está acima de 80% (`npm run test:coverage`)
- [ ] Testes de autenticação têm cobertura de 100%
- [ ] Testes de integração cobrem rotas críticas
- [ ] Pelo menos 1 teste E2E para fluxo principal
- [ ] Sem `console.log` nos testes (use mocks)
- [ ] Sem testes pulados (`it.skip` ou `describe.skip`)
- [ ] Banco de dados de teste é limpo após cada teste

---

## 🚀 Workflow de Desenvolvimento com TDD

### Para Nova Funcionalidade

1. **Criar branch de feature**
   ```bash
   git checkout -b feature/nome-da-feature
   ```

2. **Escrever teste que falha (RED)**
   ```bash
   npm test -- --watch
   ```

3. **Implementar código mínimo (GREEN)**
   - Fazer teste passar

4. **Refatorar (REFACTOR)**
   - Melhorar código
   - Manter testes passando

5. **Commit**
   ```bash
   git add .
   git commit -m "feat(scope): description

   - Implementado funcionalidade X
   - Testes: 100% coverage
   - Closes #123"
   ```

6. **Push e PR**
   ```bash
   git push origin feature/nome-da-feature
   ```

### Para Correção de Bug

1. **Escrever teste que reproduz o bug (RED)**
   ```typescript
   it('deve corrigir loop infinito de redirect', async () => {
     // Teste que falha por causa do bug
   });
   ```

2. **Corrigir o bug (GREEN)**
   - Fazer teste passar

3. **Refatorar se necessário (REFACTOR)**

4. **Commit com referência ao issue**
   ```bash
   git commit -m "fix(auth): corrige loop infinito de redirect

   - Adiciona guard de redirect no sessionStorage
   - Testes: previne regressão
   - Fixes #456"
   ```

---

## 🎓 Resumo Executivo

### Antes de escrever código:
1. ✍️ Escreva o teste
2. ❌ Execute e veja falhar
3. ✅ Implemente código mínimo
4. ✅ Veja teste passar
5. ♻️ Refatore se necessário
6. 🔁 Repita

### Lembre-se:
- **"Se não está testado, está quebrado"**
- **"Testes são documentação executável"**
- **"TDD não deixa você mais lento, deixa você mais seguro"**

---

**Última Atualização:** 14 de Novembro de 2025  
**Versão:** 1.0.0  
**Status:** Obrigatório para todos os PRs
````