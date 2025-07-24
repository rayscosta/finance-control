#!/bin/bash

# Finance Control - Script de Instalação Automatizada
# Execute: chmod +x install.sh && ./install.sh

echo "🚀 Finance Control - Instalação Automatizada"
echo "=============================================="

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js 18+ primeiro."
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js versão $NODE_VERSION encontrada. Requer versão 18.0.0 ou superior."
    exit 1
fi

echo "✅ Node.js $NODE_VERSION encontrado"

# Verificar se PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL não encontrado. Instalando..."
    
    # Detectar sistema operacional
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Ubuntu/Debian
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y postgresql postgresql-contrib
        # CentOS/RHEL
        elif command -v yum &> /dev/null; then
            sudo yum install -y postgresql-server postgresql-contrib
            sudo postgresql-setup initdb
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew &> /dev/null; then
            brew install postgresql
            brew services start postgresql
        else
            echo "❌ Homebrew não encontrado. Instale PostgreSQL manualmente."
            exit 1
        fi
    fi
else
    echo "✅ PostgreSQL encontrado"
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Configurar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "⚙️  Configurando variáveis de ambiente..."
    cp .env.example .env
    
    # Gerar JWT secret aleatório
    JWT_SECRET=$(openssl rand -hex 32)
    sed -i.bak "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
    
    echo "🔑 JWT Secret gerado automaticamente"
    echo "📝 Por favor, configure DATABASE_URL no arquivo .env"
fi

# Verificar se existe configuração de banco
if grep -q "postgresql://username:password@localhost:5432/finance_control" .env; then
    echo "⚠️  Configuração padrão de banco detectada."
    echo "Por favor, configure DATABASE_URL no arquivo .env antes de continuar."
    read -p "Pressione Enter depois de configurar o banco de dados..."
fi

# Gerar cliente Prisma
echo "🔄 Gerando cliente Prisma..."
npx prisma generate

# Executar migrações
echo "🗄️  Executando migrações do banco de dados..."
if npx prisma migrate dev --name init; then
    echo "✅ Migrações executadas com sucesso"
else
    echo "❌ Erro ao executar migrações. Verifique a configuração do banco."
    exit 1
fi

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p uploads logs

# Instalar Redis (opcional)
read -p "🔄 Deseja instalar Redis para cache? (y/N): " install_redis
if [[ $install_redis =~ ^[Yy]$ ]]; then
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get install -y redis-server
            sudo systemctl start redis-server
            sudo systemctl enable redis-server
        elif command -v yum &> /dev/null; then
            sudo yum install -y redis
            sudo systemctl start redis
            sudo systemctl enable redis
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install redis
            brew services start redis
        fi
    fi
    echo "✅ Redis instalado e iniciado"
fi

# Executar testes
echo "🧪 Executando testes..."
if npm test; then
    echo "✅ Todos os testes passaram"
else
    echo "⚠️  Alguns testes falharam. Verifique os logs."
fi

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npm run build

echo ""
echo "🎉 Instalação concluída com sucesso!"
echo "=================================="
echo ""
echo "📋 Próximos passos:"
echo "1. Configure suas variáveis de ambiente em .env"
echo "2. Execute 'npm run dev' para iniciar em modo desenvolvimento"
echo "3. Acesse http://localhost:3000 no seu navegador"
echo ""
echo "📚 Comandos úteis:"
echo "  npm run dev       - Iniciar em desenvolvimento"
echo "  npm run build     - Compilar para produção"
echo "  npm start         - Iniciar em produção"
echo "  npm test          - Executar testes"
echo "  npm run migrate   - Executar migrações"
echo ""
echo "📖 Documentação completa: README.md"
echo "🔧 Orientações de desenvolvimento: .copilotinstructions"
echo ""

# Perguntar se deseja iniciar o servidor
read -p "🚀 Deseja iniciar o servidor agora? (y/N): " start_server
if [[ $start_server =~ ^[Yy]$ ]]; then
    echo "Iniciando servidor..."
    npm run dev
fi
