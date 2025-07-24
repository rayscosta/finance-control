import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testIsGlobal() {
  try {
    console.log('🔍 Testando campo isGlobal...');
    
    // Tentar buscar categorias globais
    const globalCategories = await prisma.category.findMany({
      where: {
        isGlobal: true
      },
      select: {
        id: true,
        name: true,
        isGlobal: true,
        userId: true
      }
    });
    
    console.log(`✅ Encontradas ${globalCategories.length} categorias globais:`);
    console.log(globalCategories.slice(0, 3));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testIsGlobal();
