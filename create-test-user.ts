import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Verificar se já existe usuário
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@finance.com' }
    });

    if (existingUser) {
      console.log('✅ Usuário já existe!');
      console.log('📧 Email: admin@finance.com');
      console.log('🔑 Senha: admin123');
      return;
    }

    // Criar novo usuário
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@finance.com',
        password: hashedPassword
      }
    });

    console.log('✅ Usuário criado com sucesso!');
    console.log('📧 Email: admin@finance.com');
    console.log('🔑 Senha: admin123');
    console.log('🆔 ID:', user.id);
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
