import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller';
import { createUserSchema, loginSchema, validateSchema } from '../middleware/validation';

const router = Router();
const authController = new AuthController();

/**
 * @route POST /api/auth/register
 * @desc Registrar novo usuário
 * @access Public
 */
router.post('/register', validateSchema(createUserSchema), authController.register);

/**
 * @route POST /api/auth/login
 * @desc Login de usuário
 * @access Public
 */
router.post('/login', validateSchema(loginSchema), authController.login);

/**
 * @route GET /api/auth/profile
 * @desc Obter perfil do usuário
 * @access Private
 */
router.get('/profile', authController.getProfile);

/**
 * @route PUT /api/auth/profile
 * @desc Atualizar perfil do usuário
 * @access Private
 */
router.put('/profile', authController.updateProfile);

export default router;
