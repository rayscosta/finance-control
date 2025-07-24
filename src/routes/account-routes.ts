import { Router } from 'express';
import { AccountController } from '../controllers/account-controller';
import { authenticateToken } from '../middleware/auth';
import { createAccountSchema, validateSchema } from '../middleware/validation';

const router = Router();
const accountController = new AccountController();

// Aplicar autenticação a todas as rotas
router.use(authenticateToken);

/**
 * @route POST /api/accounts
 * @desc Criar nova conta
 * @access Private
 */
router.post('/', validateSchema(createAccountSchema), accountController.create);

/**
 * @route GET /api/accounts
 * @desc Obter todas as contas do usuário
 * @access Private
 */
router.get('/', accountController.getAll);

/**
 * @route GET /api/accounts/total-balance
 * @desc Obter saldo total de todas as contas
 * @access Private
 */
router.get('/total-balance', accountController.getTotalBalance);

/**
 * @route GET /api/accounts/type/:type
 * @desc Obter contas por tipo
 * @access Private
 */
router.get('/type/:type', accountController.getByType);

/**
 * @route GET /api/accounts/:id
 * @desc Obter conta por ID
 * @access Private
 */
router.get('/:id', accountController.getById);

/**
 * @route PUT /api/accounts/:id
 * @desc Atualizar conta
 * @access Private
 */
router.put('/:id', validateSchema(createAccountSchema), accountController.update);

/**
 * @route DELETE /api/accounts/:id
 * @desc Excluir conta
 * @access Private
 */
router.delete('/:id', accountController.delete);

export default router;
