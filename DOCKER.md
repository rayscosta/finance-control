# 🐳 Docker Setup - Finance Control

## 📋 Pré-requisitos

- Docker instalado: https://docs.docker.com/get-docker/
- Docker Compose instalado (geralmente vem com Docker Desktop)

## 🚀 Comandos Rápidos

### Desenvolvimento (com hot-reload)

```bash
# Iniciar aplicação + banco de dados em modo desenvolvimento
docker compose -f docker-compose.dev.yml up -d

# Ver logs
docker compose -f docker-compose.dev.yml logs -f

# Parar containers
docker compose -f docker-compose.dev.yml down

# Parar e remover volumes (limpar banco de dados)
docker compose -f docker-compose.dev.yml down -v
```

### Produção

```bash
# Iniciar aplicação + banco de dados em modo produção
docker compose up -d

# Ver logs
docker compose logs -f

# Parar containers
docker compose down

# Parar e remover volumes
docker compose down -v
```

## 📦 O que foi configurado

### 🗄️ PostgreSQL Container
- **Imagem**: `postgres:16-alpine`
- **Porta**: `5432`
- **Usuário**: `postgres`
- **Senha**: `postgres`
- **Database**: `finance_control`
- **Volume persistente**: Dados salvos em volume Docker

### 🚀 Aplicação Node.js Container
- **Node**: v23
- **Porta**: `3000`
- **Hot-reload**: Ativado em modo dev
- **Prisma**: Migrations e seed automáticos no startup
- **Healthcheck**: Aguarda PostgreSQL estar pronto

## 🔧 Comandos Úteis

### Acessar o banco de dados

```bash
# Via Docker
docker exec -it finance-postgres-dev psql -U postgres -d finance_control

# Ou se tiver psql local instalado
psql -h localhost -p 5432 -U postgres -d finance_control
```

### Ver logs específicos

```bash
# Logs da aplicação
docker logs finance-app-dev -f

# Logs do banco
docker logs finance-postgres-dev -f
```

### Recriar containers

```bash
# Reconstruir imagens e recriar containers
docker compose -f docker-compose.dev.yml up -d --build

# Forçar recriação completa
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d --build
```

### Executar comandos Prisma dentro do container

```bash
# Criar migration
docker exec -it finance-app-dev npx prisma migrate dev --name nome_da_migration

# Executar seed
docker exec -it finance-app-dev npx prisma db seed

# Abrir Prisma Studio
docker exec -it finance-app-dev npx prisma studio
```

### Executar comandos npm dentro do container

```bash
# Instalar nova dependência
docker exec -it finance-app-dev npm install nome-pacote

# Rodar testes
docker exec -it finance-app-dev npm test

# Build
docker exec -it finance-app-dev npm run build
```

## 🌍 Variáveis de Ambiente

As variáveis são configuradas automaticamente pelo Docker Compose:

- `DATABASE_URL`: Conexão com PostgreSQL (usa hostname `postgres` dentro da rede Docker)
- `JWT_SECRET`: Chave para tokens JWT
- `PORT`: Porta da aplicação (3000)
- `NODE_ENV`: Ambiente (development/production)

## 📝 Estrutura de Arquivos

```
.
├── Dockerfile              # Build para produção (otimizado, multi-stage)
├── Dockerfile.dev          # Build para desenvolvimento (hot-reload)
├── docker-compose.yml      # Orquestração produção
├── docker-compose.dev.yml  # Orquestração desenvolvimento
├── .dockerignore           # Arquivos ignorados no build
└── .env                    # Variáveis de ambiente (não versionado)
```

## 🎯 Workflow Recomendado

### Desenvolvimento Local

1. **Primeira vez**:
   ```bash
   docker compose -f docker-compose.dev.yml up -d
   # Aguarde migrations e seed automáticos
   ```

2. **Dia a dia**:
   - Os containers já estão rodando
   - Edite o código normalmente
   - Hot-reload detecta mudanças automaticamente
   - Acesse: http://localhost:3000

3. **Parar ao final do dia**:
   ```bash
   docker compose -f docker-compose.dev.yml stop
   ```

4. **Continuar no dia seguinte**:
   ```bash
   docker compose -f docker-compose.dev.yml start
   ```

### Deploy em Produção

1. **Build e deploy**:
   ```bash
   docker compose up -d --build
   ```

2. **Verificar saúde**:
   ```bash
   docker compose ps
   docker compose logs -f
   ```

## 🔍 Troubleshooting

### Porta 5432 já em uso
```bash
# Verificar se há PostgreSQL local rodando
sudo systemctl stop postgresql

# Ou mudar porta no docker-compose.yml
ports:
  - "5433:5432"  # Usar 5433 externamente
```

### Migrations não aplicadas
```bash
# Aplicar manualmente
docker exec -it finance-app-dev npx prisma migrate deploy
docker exec -it finance-app-dev npx prisma db seed
```

### Container não inicia
```bash
# Ver logs detalhados
docker compose -f docker-compose.dev.yml logs

# Limpar tudo e recomeçar
docker compose -f docker-compose.dev.yml down -v
docker system prune -a
docker compose -f docker-compose.dev.yml up -d --build
```

### Banco de dados corrompido
```bash
# Resetar banco (CUIDADO: apaga todos os dados!)
docker compose -f docker-compose.dev.yml down -v
docker compose -f docker-compose.dev.yml up -d
```

## 🎨 Prisma Studio

Para visualizar/editar dados graficamente:

```bash
# Dentro do container
docker exec -it finance-app-dev npx prisma studio

# Acesse: http://localhost:5555
```

## 📊 Monitoramento

### Ver uso de recursos

```bash
docker stats finance-app-dev finance-postgres-dev
```

### Ver networks

```bash
docker network ls
docker network inspect finance-control_finance-network
```

### Ver volumes

```bash
docker volume ls
docker volume inspect finance-control_postgres_dev_data
```

## 🔒 Segurança em Produção

⚠️ **Antes de fazer deploy:**

1. **Altere o JWT_SECRET** no `.env`:
   ```bash
   # Gerar chave segura
   openssl rand -base64 32
   ```

2. **Use senhas fortes** para PostgreSQL:
   ```yaml
   POSTGRES_PASSWORD: sua-senha-super-segura
   ```

3. **Configure variáveis de ambiente** seguras:
   ```bash
   # Não commitar .env
   # Usar secrets do Docker Swarm/Kubernetes em produção
   ```

4. **Limite exposição de portas**:
   ```yaml
   # Não exponha PostgreSQL externamente em produção
   # Remova: ports: - "5432:5432"
   ```

## 📚 Recursos

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-aws-ecs)
