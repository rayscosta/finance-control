import { Router } from 'express';
import { categoryController } from '../controllers/CategoryController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

// GET /api/categories - Listar todas as categorias disponíveis para o usuário
router.get('/', categoryController.getAvailableCategories.bind(categoryController));

// GET /api/categories/global - Listar apenas categorias globais
router.get('/global', categoryController.getGlobalCategories.bind(categoryController));

// GET /api/categories/user - Listar apenas categorias do usuário
router.get('/user', categoryController.getUserCategories.bind(categoryController));

// GET /api/categories/stats - Estatísticas de categorias
router.get('/stats', categoryController.getCategoryStats.bind(categoryController));

// GET /api/categories/:id - Buscar categoria por ID
router.get('/:id', categoryController.getCategoryById.bind(categoryController));

// POST /api/categories - Criar uma nova categoria do usuário
router.post('/', categoryController.createUserCategory.bind(categoryController));

export default router;
