import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function testLogin(email, password) {
  try {
    console.log(`🔍 Testando login para: ${email}`);
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    
    console.log('✅ Usuário encontrado:');
    console.log(`   Nome: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Hash da senha no banco: ${user.password.substring(0, 20)}...`);
    
    // Testar senha
    console.log(`\n🔐 Testando senha: "${password}"`);
    
    const isValid = await bcrypt.compare(password, user.password);
    
    if (isValid) {
      console.log('✅ Senha válida! Login seria aceito.');
    } else {
      console.log('❌ Senha inválida! Login rejeitado.');
      
      // Testar algumas senhas comuns para debug
      console.log('\n🧪 Testando senhas de debug:');
      const testPasswords = ['K@r123456', 'Senha123!', '123456', 'teste'];
      
      for (const testPass of testPasswords) {
        const testResult = await bcrypt.compare(testPass, user.password);
        console.log(`   "${testPass}": ${testResult ? '✅ VÁLIDA' : '❌ inválida'}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Testa com o primeiro usuário
testLogin('teste@email.com', 'K@r123456');
