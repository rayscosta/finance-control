import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class CategoryService {
  // Listar todas as categorias disponíveis para um usuário (globais + suas próprias)
  async getAvailableCategories(userId: string) {
    try {
      const categories = await prisma.category.findMany({
        where: {
          OR: [
            { userId: null, isGlobal: true },    // Categorias globais
            { userId: userId }                   // Categorias específicas do usuário
          ]
        },
        orderBy: [
          { isGlobal: 'desc' },
          { type: 'asc' },
          { name: 'asc' }
        ]
      });

      return categories;
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      throw error;
    }
  }

  // Listar apenas categorias globais
  async getGlobalCategories() {
    try {
      const categories = await prisma.category.findMany({
        where: { isGlobal: true },
        orderBy: [
          { type: 'asc' },
          { name: 'asc' }
        ]
      });

      return categories;
    } catch (error) {
      console.error('Erro ao buscar categorias globais:', error);
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
      const category = await prisma.category.create({
        data: {
          name: categoryData.name,
          type: categoryData.type,
          color: categoryData.color || '#6b7280',
          icon: categoryData.icon || '📁',
          isGlobal: false,
          userId: userId
        }
      });

      return category;
    } catch (error) {
      console.error('Erro ao criar categoria do usuário:', error);
      throw error;
    }
  }
}

export const categoryService = new CategoryService();
