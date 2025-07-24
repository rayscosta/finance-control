import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    
    // Testar conexão
    await prisma.$connect();
    console.log('✅ Conexão com o banco estabelecida!');
    
    // Listar todos os usuários
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('\n👥 USUÁRIOS CADASTRADOS:');
    console.log('========================');
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado no banco de dados');
    } else {
      users.forEach((user, index) => {
        console.log(`\n${index + 1}. ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Nome: ${user.name}`);
        console.log(`   Criado em: ${user.createdAt.toLocaleString('pt-BR')}`);
        console.log(`   Atualizado em: ${user.updatedAt.toLocaleString('pt-BR')}`);
      });
      
      console.log(`\n📊 Total: ${users.length} usuário(s) cadastrado(s)`);
    }
    
    // Verificar tabelas existentes
    console.log('\n🗃️  VERIFICANDO ESTRUTURA DO BANCO:');
    console.log('==================================');
    
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('Tabelas encontradas:', result);
    
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco:', error);
    
    if (error.code === 'P1001') {
      console.log('\n💡 Possíveis soluções:');
      console.log('1. Verifique se o PostgreSQL está rodando');
      console.log('2. Confira as credenciais no arquivo .env');
      console.log('3. Execute: sudo systemctl start postgresql');
    }
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão com o banco encerrada');
  }
}

listUsers();
