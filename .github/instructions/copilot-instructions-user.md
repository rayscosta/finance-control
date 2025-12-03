# 🧑 Instruções do Copilot - Módulo de Usuário

## 📋 Visão Geral

Este documento contém todas as regras, requisitos, padrões e orientações específicas para o **módulo de usuário** do Finance Control. Consulte este arquivo sempre que trabalhar com funcionalidades relacionadas a usuários, autenticação, autorização e perfil.

---

## 🎯 Propósito do Módulo

O módulo de usuário é responsável por:
- Autenticação e autorização de usuários
- Gerenciamento de perfis e informações pessoais
- Controle de sessões e tokens JWT
- Auditoria de ações do usuário
- Recuperação e reset de senha
- Segregação de dados por usuário

---

## 📊 Modelo de Dados

### Entidade: User

```prisma
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  password          String   // Hash bcrypt (min 10 rounds)
  name              String
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Relacionamentos
  accounts          Account[]
  categories        Category[]
  transactions      Transaction[]
  creditCards       CreditCard[]
  budgets           Budget[]
  
  // Tokens de reset de senha (implementação futura)
  passwordResetToken     String?   @unique
  passwordResetExpires   DateTime?
}
```

### Campos Obrigatórios
- ✅ `email` - Único, formato válido
- ✅ `password` - Hash bcrypt, mínimo 6 caracteres (antes do hash)
- ✅ `name` - Nome completo do usuário

### Campos Opcionais
- `passwordResetToken` - Token temporário para reset de senha
- `passwordResetExpires` - Expiração do token (24 horas)

---

## 🔐 Segurança

### 1. Senhas

**Regras:**
- ✅ Mínimo 6 caracteres (recomendado: 8+)
- ✅ Hash usando bcrypt com **10+ rounds**
- ❌ NUNCA retornar senha em APIs
- ✅ Validar força da senha no frontend
- ✅ Permitir reset apenas com token válido

**Implementação:**
```typescript
import bcrypt from 'bcrypt';

// Criar hash
const hashedPassword = await bcrypt.hash(password, 10);

// Verificar senha
const isValid = await bcrypt.compare(password, user.password);
```

### 2. JWT Tokens

**Configuração:**
```typescript
{
  algorithm: 'HS256',
  expiresIn: '7d', // 7 dias
  secret: process.env.JWT_SECRET // Mínimo 32 caracteres
}
```

**Payload do Token:**
```typescript
{
  userId: string,   // ID do usuário (cuid)
  email: string,    // Email do usuário
  iat: number,      // Issued at
  exp: number       // Expiration
}
```

**Armazenamento:**
- ✅ `localStorage` - Se "lembrar de mim" = true (persistente)
- ✅ `sessionStorage` - Se "lembrar de mim" = false (sessão)
- ❌ NUNCA em cookies sem HttpOnly/Secure em produção

### 3. Validação de Entrada

**Email:**
```typescript
// Usar biblioteca Joi
const emailSchema = Joi.string().email().required();
```

**Senha:**
```typescript
const passwordSchema = Joi.string().min(6).required();
```

**Nome:**
```typescript
const nameSchema = Joi.string().min(2).max(100).required();
```

### 4. Rate Limiting

- ✅ Login: 5 tentativas por 15 minutos
- ✅ Registro: 3 tentativas por hora
- ✅ Reset de senha: 3 tentativas por hora

---

## 🔌 API Endpoints

### POST /api/auth/register
**Propósito:** Criar nova conta de usuário

**Request Body:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Response Success (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "name": "João Silva",
      "email": "joao@example.com",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGc..."
  },
  "message": "Usuário criado com sucesso"
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Email já cadastrado"
}
```

**Regras de Negócio:**
- ✅ Email único no sistema
- ✅ Senha hashada antes de salvar
- ✅ Retornar token JWT automaticamente
- ✅ Criar log de auditoria (USER_CREATED)
- ❌ Não permitir registro de admin via API pública

---

### POST /api/auth/login
**Propósito:** Autenticar usuário existente

**Request Body:**
```json
{
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "name": "João Silva",
      "email": "joao@example.com"
    },
    "token": "eyJhbGc..."
  },
  "message": "Login realizado com sucesso"
}
```

**Response Error (401):**
```json
{
  "success": false,
  "message": "Credenciais inválidas"
}
```

**Regras de Negócio:**
- ✅ Validar email e senha
- ✅ Comparar hash bcrypt
- ✅ Gerar novo token JWT
- ✅ Criar log de auditoria (USER_LOGIN)
- ❌ Não revelar se email existe ou se senha está errada (segurança)

---

### GET /api/auth/me
**Propósito:** Obter dados do usuário autenticado

**Headers:**
```
Authorization: Bearer <token>
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "João Silva",
    "email": "joao@example.com",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

**Regras de Negócio:**
- ✅ Requer autenticação (middleware)
- ❌ NUNCA retornar campo `password`
- ✅ Pode incluir dados agregados (total de contas, transações, etc.)

---

### GET /api/auth/profile
**Propósito:** Obter perfil completo do usuário (alias para /me)

**Comportamento:** Idêntico a GET /api/auth/me

---

### PUT /api/auth/profile
**Propósito:** Atualizar dados do perfil

**Request Body:**
```json
{
  "name": "João Pedro Silva",
  "email": "joaopedro@example.com"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "clx...",
    "name": "João Pedro Silva",
    "email": "joaopedro@example.com",
    "updatedAt": "2025-01-02T00:00:00.000Z"
  },
  "message": "Perfil atualizado com sucesso"
}
```

**Regras de Negócio:**
- ✅ Requer autenticação
- ✅ Validar novo email único
- ✅ Não permitir alteração de password (usar endpoint específico)
- ✅ Criar log de auditoria (USER_UPDATED)
- ✅ Atualizar `updatedAt` automaticamente

---

### POST /api/auth/forgot-password
**Propósito:** Solicitar reset de senha

**Request Body:**
```json
{
  "email": "joao@example.com"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Se o email existir em nossa base, você receberá instruções para resetar sua senha."
}
```

**Regras de Negócio:**
- ✅ Sempre retornar sucesso (prevenir enumeração de emails)
- ✅ Gerar token aleatório criptograficamente seguro
- ✅ Definir expiração de 24 horas
- ✅ Enviar email com link de reset (implementação futura)
- ✅ Criar log de auditoria (PASSWORD_RESET_REQUESTED)
- ❌ Não revelar se email existe

---

### POST /api/auth/reset-password
**Propósito:** Resetar senha com token válido

**Request Body:**
```json
{
  "token": "abc123...",
  "newPassword": "novaSenha123"
}
```

**Response Success (200):**
```json
{
  "success": true,
  "message": "Senha resetada com sucesso. Você já pode fazer login."
}
```

**Response Error (400):**
```json
{
  "success": false,
  "message": "Token inválido ou expirado"
}
```

**Regras de Negócio:**
- ✅ Validar token e expiração
- ✅ Validar nova senha (mín. 6 caracteres)
- ✅ Hashear nova senha com bcrypt
- ✅ Invalidar token após uso
- ✅ Criar log de auditoria (PASSWORD_RESET_COMPLETED)
- ✅ Opcional: Invalidar todas as sessões existentes

---

## 🔑 Middleware de Autenticação

### authenticateToken

**Arquivo:** `src/middleware/auth.ts`

**Propósito:** Validar JWT e anexar usuário à requisição

**Implementação:**
```typescript
export const authenticateToken = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token não fornecido'
      });
    }
    
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    
    // Anexar usuário à requisição
    req.user = {
      userId: decoded.userId,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido ou expirado'
    });
  }
};
```

**Uso:**
```typescript
// Proteger rota
router.get('/profile', authenticateToken, profileController.getProfile);

// Proteger todas as rotas de um router
router.use(authenticateToken);
```

---

## 📝 Validação de Dados

### Schemas Joi

**Arquivo:** `src/middleware/validation.ts`

```typescript
export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required()
    .messages({
      'string.empty': 'Nome é obrigatório',
      'string.min': 'Nome deve ter pelo menos 2 caracteres'
    }),
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Email inválido',
      'string.empty': 'Email é obrigatório'
    }),
  password: Joi.string().min(6).required()
    .messages({
      'string.min': 'Senha deve ter pelo menos 6 caracteres',
      'string.empty': 'Senha é obrigatória'
    })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email()
}).min(1); // Pelo menos um campo
```

---

## 🎨 Frontend - Componentes

### 1. Formulário de Login

**Arquivo:** `public/login.html`

**Elementos Obrigatórios:**
```html
<form id="loginForm">
  <input type="email" id="login-email" required>
  <input type="password" id="login-password" required>
  <input type="checkbox" id="remember-me">
  <button type="submit">Entrar</button>
</form>
<div id="login-message"></div>
```

**JavaScript:** `public/js/auth.js`
- Classe `AuthManager`
- Método `handleLogin()`
- Salvar token em localStorage/sessionStorage conforme checkbox

### 2. Formulário de Registro

**Elementos Obrigatórios:**
```html
<form id="registerForm">
  <input type="text" id="register-name" required>
  <input type="email" id="register-email" required>
  <input type="password" id="register-password" required>
  <button type="submit">Criar Conta</button>
</form>
<div id="register-message"></div>
```

### 3. Menu do Usuário

**Arquivo:** `public/dashboard.html` (e outras páginas autenticadas)

**Estrutura:**
```html
<div class="user-menu">
  <div class="user-icon">👤</div>
  <div class="user-info">
    <div class="user-name" id="userName">Usuário</div>
    <div class="user-email" id="userEmail">user@email.com</div>
  </div>
  <div class="dropdown-menu">
    <a href="/profile.html">Meu Perfil</a>
    <a href="#" onclick="logout()">Sair</a>
  </div>
</div>
```

**JavaScript para carregar dados:**
```javascript
async function loadUserInfo() {
  const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  const response = await fetch('/api/auth/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (response.ok) {
    const data = await response.json();
    document.getElementById('userName').textContent = data.data.name;
    document.getElementById('userEmail').textContent = data.data.email;
  }
}
```

---

## 🔄 Fluxos de Trabalho

### Fluxo de Registro
1. Usuário preenche formulário (nome, email, senha)
2. Frontend valida campos básicos
3. POST /api/auth/register
4. Backend valida schema Joi
5. Backend verifica email único
6. Backend hash senha (bcrypt)
7. Backend cria usuário no banco
8. Backend gera token JWT
9. Backend cria log de auditoria
10. Frontend salva token
11. Frontend redireciona para dashboard

### Fluxo de Login
1. Usuário preenche email e senha
2. POST /api/auth/login
3. Backend busca usuário por email
4. Backend compara hash da senha
5. Backend gera novo token JWT
6. Backend cria log de auditoria
7. Frontend salva token (localStorage ou sessionStorage)
8. Frontend redireciona para dashboard

### Fluxo de Autenticação em Páginas
1. Página carrega
2. JavaScript verifica token em storage
3. Se não tiver token → redireciona para login
4. Se tiver token → GET /api/auth/me
5. Se 401 → redireciona para login
6. Se 200 → carrega dados do usuário
7. Exibe nome e email no menu

### Fluxo de Logout
1. Usuário clica em "Sair"
2. Frontend remove token do storage
3. Frontend remove dados do usuário
4. Frontend redireciona para login
5. (Opcional) Backend invalida token em blacklist

### Fluxo de Reset de Senha
1. Usuário clica "Esqueci minha senha"
2. Insere email
3. POST /api/auth/forgot-password
4. Backend gera token aleatório
5. Backend salva token e expiração
6. Backend envia email (implementação futura)
7. Usuário clica link do email
8. Página de reset carrega com token na URL
9. Usuário insere nova senha
10. POST /api/auth/reset-password
11. Backend valida token e expiração
12. Backend atualiza senha
13. Backend invalida token
14. Frontend redireciona para login

---

## 🧪 Testes

### Casos de Teste - Registro

✅ **Deve criar usuário com dados válidos**
- Input: nome, email único, senha válida
- Output: 201, usuário criado, token retornado

❌ **Deve rejeitar email duplicado**
- Input: email já cadastrado
- Output: 400, "Email já cadastrado"

❌ **Deve rejeitar senha curta**
- Input: senha com menos de 6 caracteres
- Output: 400, "Senha deve ter pelo menos 6 caracteres"

❌ **Deve rejeitar email inválido**
- Input: email sem @
- Output: 400, "Email inválido"

### Casos de Teste - Login

✅ **Deve autenticar com credenciais válidas**
- Input: email e senha corretos
- Output: 200, token JWT válido

❌ **Deve rejeitar senha incorreta**
- Input: email correto, senha errada
- Output: 401, "Credenciais inválidas"

❌ **Deve rejeitar email não cadastrado**
- Input: email inexistente
- Output: 401, "Credenciais inválidas"

### Casos de Teste - Token

✅ **Deve aceitar token válido**
- Input: token JWT correto no header
- Output: Acesso permitido

❌ **Deve rejeitar token expirado**
- Input: token antigo (>7 dias)
- Output: 401, "Token inválido ou expirado"

❌ **Deve rejeitar token malformado**
- Input: token inválido
- Output: 401, "Token inválido ou expirado"

---

## 📊 Auditoria e Logs

### Eventos a Auditar

| Evento | Tipo | Dados |
|--------|------|-------|
| Registro | USER_CREATED | userId, email, ip |
| Login | USER_LOGIN | userId, email, ip, userAgent |
| Logout | USER_LOGOUT | userId, ip |
| Atualização de perfil | USER_UPDATED | userId, campos alterados |
| Tentativa de login falha | LOGIN_FAILED | email, ip, motivo |
| Reset de senha solicitado | PASSWORD_RESET_REQUESTED | userId, email, ip |
| Reset de senha concluído | PASSWORD_RESET_COMPLETED | userId, ip |
| Token inválido | INVALID_TOKEN | endpoint, ip, erro |

### Implementação

```typescript
import { auditLogger } from '../utils/logger';

auditLogger.logAuth('USER_LOGIN', {
  userId: user.id,
  email: user.email,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  success: true
});
```

---

## ⚠️ Regras de Negócio Críticas

### 🔴 NUNCA FAÇA

❌ Retornar senha em respostas de API (mesmo hashada)
❌ Armazenar senhas em plain text
❌ Usar tokens sem expiração
❌ Revelar se email existe ou não (enumeration attack)
❌ Permitir senhas fracas em produção
❌ Logar senhas ou tokens completos
❌ Permitir CORS aberto em produção
❌ Expor detalhes de erro em produção

### 🟢 SEMPRE FAÇA

✅ Hash de senhas com bcrypt (10+ rounds)
✅ Validar e sanitizar todos os inputs
✅ Usar HTTPS em produção
✅ Implementar rate limiting
✅ Criar logs de auditoria
✅ Validar tokens JWT em todas as rotas protegidas
✅ Usar variáveis de ambiente para secrets
✅ Atualizar `updatedAt` em modificações
✅ Testar fluxos de autenticação completamente

---

## 🔧 Configuração de Ambiente

### Variáveis Obrigatórias

```bash
# .env
JWT_SECRET=sua-chave-super-secreta-minimo-32-caracteres
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/finance_control
```

### Validação de Secrets

```typescript
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres');
}
```

---

## 🐛 Troubleshooting

### Problema: "Token inválido ou expirado"
**Causas:**
- Token expirado (>7 dias)
- JWT_SECRET alterado
- Token malformado
- Header Authorization incorreto

**Solução:**
1. Verificar formato: `Authorization: Bearer <token>`
2. Verificar expiração do token
3. Fazer login novamente
4. Verificar JWT_SECRET no .env

### Problema: "Email já cadastrado"
**Causas:**
- Usuário já existe no banco
- Email case-sensitive no banco

**Solução:**
1. Usar email único (constraint no banco)
2. Normalizar email (lowercase) antes de salvar

### Problema: Usuário não aparece no menu
**Causas:**
- Token não salvo no storage
- Rota /api/auth/me falhando
- JavaScript não executando loadUserInfo()
- IDs dos elementos HTML incorretos

**Solução:**
1. Verificar token em DevTools → Application → Storage
2. Verificar chamada API em DevTools → Network
3. Verificar console do navegador para erros
4. Garantir que IDs `userName` e `userEmail` existem no HTML

---

## 📚 Referências

- [bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [JWT.io](https://jwt.io/)
- [Joi Validation](https://joi.dev/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Prisma User Model](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model)

---

## 🔄 Changelog

| Data | Versão | Alterações |
|------|--------|------------|
| 2025-11-13 | 1.0.0 | Criação inicial do documento |

---

## 📞 Contato

Para dúvidas sobre este módulo, consulte:
- README.md principal do projeto
- Documentação da API em `/docs`
- Issues no repositório

---

**⚡ Lembre-se:** Este é um sistema financeiro. Segurança é PRIORIDADE #1.
