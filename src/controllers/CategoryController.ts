import { Request, Response } from 'express';
import { categoryService } from '../services/CategoryService';

export class CategoryController {
  // GET /api/categories - Listar todas as categorias disponíveis para o usuário
  async getAvailableCategories(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const categories = await categoryService.getAvailableCategories(userId);
      
      res.json({
        success: true,
        data: categories,
        message: 'Categorias recuperadas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/categories/global - Listar apenas categorias globais
  async getGlobalCategories(req: Request, res: Response): Promise<void> {
    try {
      const categories = await categoryService.getGlobalCategories();
      
      res.json({
        success: true,
        data: categories,
        message: 'Categorias globais recuperadas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao buscar categorias globais:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/categories/user - Listar apenas categorias do usuário
  async getUserCategories(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const categories = await categoryService.getUserCategories(userId);
      
      res.json({
        success: true,
        data: categories,
        message: 'Categorias do usuário recuperadas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao buscar categorias do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // POST /api/categories - Criar uma nova categoria do usuário
  async createUserCategory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { name, type, color, icon } = req.body;

      if (!name || !type) {
        res.status(400).json({
          success: false,
          message: 'Nome e tipo são obrigatórios'
        });
        return;
      }

      if (!['INCOME', 'EXPENSE'].includes(type)) {
        res.status(400).json({
          success: false,
          message: 'Tipo deve ser INCOME ou EXPENSE'
        });
        return;
      }

      const category = await categoryService.createUserCategory(userId, {
        name,
        type,
        color,
        icon
      });

      res.status(201).json({
        success: true,
        data: category,
        message: 'Categoria criada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Já existe')) {
          res.status(409).json({
            success: false,
            message: error.message
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/categories/:id - Buscar categoria por ID
  async getCategoryById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: 'ID da categoria é obrigatório'
        });
        return;
      }

      const category = await categoryService.getCategoryById(id, userId);

      if (!category) {
        res.status(404).json({
          success: false,
          message: 'Categoria não encontrada'
        });
        return;
      }

      res.json({
        success: true,
        data: category,
        message: 'Categoria recuperada com sucesso'
      });
    } catch (error) {
      console.error('Erro ao buscar categoria:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // GET /api/categories/stats - Estatísticas de categorias
  async getCategoryStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const stats = await categoryService.getCategoryStats(userId);
      
      res.json({
        success: true,
        data: stats,
        message: 'Estatísticas recuperadas com sucesso'
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

export const categoryController = new CategoryController();
