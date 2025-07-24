import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteAllUsers() {
  try {
    console.log('🔍 Conectando ao banco de dados...');
    await prisma.$connect();
    console.log('✅ Conexão estabelecida!');
    
    // Primeiro, listar usuários existentes
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      }
    });
    
    console.log('\n👥 USUÁRIOS ENCONTRADOS:');
    console.log('========================');
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name})`);
    });
    
    console.log(`\n📊 Total: ${users.length} usuário(s)`);
    
    // Excluir dados relacionados primeiro (ordem inversa das foreign keys)
    console.log('\n🗑️  LIMPANDO BANCO DE DADOS...');
    console.log('==============================');
    
    console.log('1. Excluindo transactions...');
    const transactions = await prisma.transaction.deleteMany({});
    console.log(`   ✅ ${transactions.count} transação(ões) excluída(s)`);
    
    console.log('2. Excluindo credit card transactions...');
    const ccTransactions = await prisma.creditCardTransaction.deleteMany({});
    console.log(`   ✅ ${ccTransactions.count} transação(ões) de cartão excluída(s)`);
    
    console.log('3. Excluindo credit card bills...');
    const ccBills = await prisma.creditCardBill.deleteMany({});
    console.log(`   ✅ ${ccBills.count} fatura(s) de cartão excluída(s)`);
    
    console.log('4. Excluindo credit cards...');
    const creditCards = await prisma.creditCard.deleteMany({});
    console.log(`   ✅ ${creditCards.count} cartão(ões) excluído(s)`);
    
    console.log('5. Excluindo accounts...');
    const accounts = await prisma.account.deleteMany({});
    console.log(`   ✅ ${accounts.count} conta(s) excluída(s)`);
    
    console.log('6. Excluindo budgets...');
    const budgets = await prisma.budget.deleteMany({});
    console.log(`   ✅ ${budgets.count} orçamento(s) excluído(s)`);
    
    console.log('7. Excluindo categories...');
    const categories = await prisma.category.deleteMany({});
    console.log(`   ✅ ${categories.count} categoria(s) excluída(s)`);
    
    console.log('8. Excluindo audit logs...');
    const auditLogs = await prisma.auditLog.deleteMany({});
    console.log(`   ✅ ${auditLogs.count} log(s) de auditoria excluído(s)`);
    
    console.log('9. Excluindo users...');
    const usersDeleted = await prisma.user.deleteMany({});
    console.log(`   ✅ ${usersDeleted.count} usuário(s) excluído(s)`);
    
    // Verificar se ainda há usuários
    const remainingUsers = await prisma.user.count();
    console.log(`\n📊 Usuários restantes: ${remainingUsers}`);
    
    if (remainingUsers === 0) {
      console.log('\n🎉 BANCO COMPLETAMENTE LIMPO!');
      console.log('✨ Agora você pode criar novos usuários via navegador.');
      console.log('🌐 Acesse: http://localhost:3000/register.html');
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar banco:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🔌 Conexão encerrada');
  }
}

deleteAllUsers();
