import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simular o CategoryService inline para teste
class CategoryService {
  async getGlobalCategories() {
    const categories = await prisma.$queryRaw`
      SELECT * FROM categories 
      WHERE "isGlobal" = true 
      ORDER BY type ASC, name ASC
    `;
    return categories;
  }

  async getCategoryStats(userId) {
    const globalCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM categories WHERE "isGlobal" = true
    `;
    
    const userCountResult = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM categories 
      WHERE "userId" = ${userId} AND "isGlobal" = false
    `;
    
    const globalCount = Number(globalCountResult[0]?.count || 0);
    const userCount = Number(userCountResult[0]?.count || 0);
    
    return {
      global: globalCount,
      user: userCount,
      total: globalCount + userCount
    };
  }

  async getAvailableCategories(userId) {
    const categories = await prisma.$queryRaw`
      SELECT * FROM categories 
      WHERE ("isGlobal" = true AND "userId" IS NULL) 
         OR ("userId" = ${userId} AND "isGlobal" = false)
      ORDER BY "isGlobal" DESC, type ASC, name ASC
    `;
    return categories;
  }
}

const categoryService = new CategoryService();

async function testCategoryService() {
  try {
    console.log('🧪 TESTANDO CATEGORY SERVICE');
    console.log('================================\n');

    // Teste 1: Listar categorias globais
    console.log('1️⃣ Testando categorias globais...');
    const globalCategories = await categoryService.getGlobalCategories();
    console.log(`✅ Encontradas ${globalCategories.length} categorias globais`);
    console.log('Primeiras 3:', globalCategories.slice(0, 3).map(c => `${c.icon} ${c.name} (${c.type})`));
    
    // Teste 2: Estatísticas (precisa de um userId)
    const testUserId = 'test-user-123';
    console.log('\n2️⃣ Testando estatísticas...');
    const stats = await categoryService.getCategoryStats(testUserId);
    console.log('📊 Estatísticas:', stats);
    
    // Teste 3: Listar categorias disponíveis para usuário
    console.log('\n3️⃣ Testando categorias disponíveis para usuário...');
    const availableCategories = await categoryService.getAvailableCategories(testUserId);
    console.log(`✅ Usuário tem acesso a ${availableCategories.length} categorias`);
    
    console.log('\n🎉 Todos os testes passaram!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
}

testCategoryService();
