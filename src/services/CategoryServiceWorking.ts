import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CategoryService {
  // Listar todas as categorias disponíveis para um usuário (globais + suas próprias)
  async getAvailableCategories(userId: string) {
    try {
      const categories = await prisma.$queryRaw`
        SELECT * FROM categories 
        WHERE ("isGlobal" = true AND "userId" IS NULL) 
           OR ("userId" = ${userId} AND "isGlobal" = false)
        ORDER BY "isGlobal" DESC, type ASC, name ASC
      `;

      return categories;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  }

  // Listar apenas categorias globais
  async getGlobalCategories() {
    try {
      const categories = await prisma.$queryRaw`
        SELECT * FROM categories 
        WHERE "isGlobal" = true 
        ORDER BY type ASC, name ASC
      `;

      return categories;
    } catch (error) {
      console.error('Erro ao buscar categorias globais:', error);
      throw error;
    }
  }

  // Listar apenas categorias específicas de um usuário
  async getUserCategories(userId: string) {
    try {
      const categories = await prisma.$queryRaw`
        SELECT * FROM categories 
        WHERE "userId" = ${userId} AND "isGlobal" = false 
        ORDER BY type ASC, name ASC
      `;

      return categories;
    } catch (error) {
      console.error('Erro ao buscar categorias do usuário:', error);
      throw error;
    }
  }

  // Criar uma categoria específica do usuário
  async createUserCategory(userId: string, categoryData: {
    name: string;
    type: 'INCOME' | 'EXPENSE';
    color?: string;
    icon?: string;
  }) {
    try {
      // Verificar se já existe uma categoria com o mesmo nome para este usuário
      const existingUserCategory = await prisma.$queryRaw`
        SELECT id FROM categories 
        WHERE name = ${categoryData.name} 
          AND "userId" = ${userId} 
          AND "isGlobal" = false
      `;

      if (Array.isArray(existingUserCategory) && existingUserCategory.length > 0) {
        throw new Error('Já existe uma categoria com este nome em suas categorias pessoais');
      }

      // Verificar se existe uma categoria global com o mesmo nome
      const existingGlobalCategory = await prisma.$queryRaw`
        SELECT id FROM categories 
        WHERE name = ${categoryData.name} 
          AND "isGlobal" = true
      `;

      if (Array.isArray(existingGlobalCategory) && existingGlobalCategory.length > 0) {
        throw new Error('Já existe uma categoria global com este nome. Use a categoria global ou escolha outro nome.');
      }

      const category = await prisma.category.create({
        data: {
          name: categoryData.name,
          type: categoryData.type,
          color: categoryData.color || '#6b7280',
          icon: categoryData.icon || '📁',
          userId: userId
        }
      });

      return category;
    } catch (error) {
      console.error('Erro ao criar categoria do usuário:', error);
      throw error;
    }
  }

  // Buscar uma categoria específica (global ou do usuário)
  async getCategoryById(categoryId: string, userId: string) {
    try {
      const categories = await prisma.$queryRaw`
        SELECT * FROM categories 
        WHERE id = ${categoryId} 
          AND (("isGlobal" = true AND "userId" IS NULL) 
               OR ("userId" = ${userId} AND "isGlobal" = false))
      `;

      return Array.isArray(categories) && categories.length > 0 ? categories[0] : null;
    } catch (error) {
      console.error('Erro ao buscar categoria por ID:', error);
      throw error;
    }
  }

  // Estatísticas de categorias
  async getCategoryStats(userId: string) {
    try {
      const globalCountResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM categories WHERE "isGlobal" = true
      `;

      const userCountResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM categories 
        WHERE "userId" = ${userId} AND "isGlobal" = false
      `;

      const incomeCountResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM categories 
        WHERE type = 'INCOME' 
          AND (("isGlobal" = true AND "userId" IS NULL) 
               OR ("userId" = ${userId} AND "isGlobal" = false))
      `;

      const expenseCountResult = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM categories 
        WHERE type = 'EXPENSE' 
          AND (("isGlobal" = true AND "userId" IS NULL) 
               OR ("userId" = ${userId} AND "isGlobal" = false))
      `;

      const globalCount = Number((globalCountResult as any)[0]?.count || 0);
      const userCount = Number((userCountResult as any)[0]?.count || 0);
      const incomeCount = Number((incomeCountResult as any)[0]?.count || 0);
      const expenseCount = Number((expenseCountResult as any)[0]?.count || 0);

      return {
        global: globalCount,
        user: userCount,
        total: globalCount + userCount,
        income: incomeCount,
        expense: expenseCount
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de categorias:', error);
      throw error;
    }
  }
}

export const categoryService = new CategoryService();
