# Como Usar o Reset de Senha

## Para Usuários

1. Na tela de login, clique em "Esqueceu a senha?"
2. Digite seu email
3. Clique em "Enviar Instruções"
4. **Verifique o console do servidor** (em desenvolvimento) para ver o token de reset
5. Use o link fornecido no console ou acesse `/reset-password.html?token=SEU_TOKEN`

## Fluxo Técnico

### 1. Solicitar Reset de Senha

```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "seu@email.com"}'
```

### 2. Verificar Token no Console do Servidor

O servidor imprimirá algo como:

```
===========================================
🔐 TOKEN DE RESET DE SENHA
===========================================
Email: seu@email.com
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Link de reset: http://localhost:3001/reset-password?token=eyJhbGc...
===========================================
```

### 3. Resetar a Senha

```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token": "SEU_TOKEN_AQUI", "newPassword": "novaSenha123"}'
```

## Próximos Passos (TODO)

- [ ] Criar página `reset-password.html` para interface amigável
- [ ] Integrar com serviço de email (SendGrid, AWS SES, etc.)
- [ ] Adicionar validação de força de senha
- [ ] Implementar rate limiting específico para reset de senha
- [ ] Adicionar histórico de resets no audit log

## Segurança

- Token expira em 1 hora
- Não revela se email existe na base (previne enumeration)
- Senha deve ter mínimo 6 caracteres
- Token só pode ser usado uma vez (implementar tabela de tokens usados)
