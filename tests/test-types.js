import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTypes() {
  try {
    // Teste básico sem isGlobal
    const basicTest = await prisma.category.findMany({
      where: {
        name: 'Salário'
      }
    });
    
    console.log('✅ Busca básica funcionou:', basicTest.length, 'resultados');
    
    // Teste com raw query
    const rawTest = await prisma.$queryRaw`
      SELECT id, name, "isGlobal", "userId" 
      FROM categories 
      WHERE "isGlobal" = true 
      LIMIT 3
    `;
    
    console.log('✅ Query raw funcionou:', rawTest);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testTypes();
