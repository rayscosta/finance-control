import { Router } from 'express';
import { AuthController } from '../controllers/auth-controller';
import { authenticateToken } from '../middleware/auth';
import { createUserSchema, loginSchema, updateProfileSchema, validateSchema } from '../middleware/validation';

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
router.get('/profile', authenticateToken, authController.getProfile);

/**
 * @route PUT /api/auth/profile
 * @desc Atualizar perfil do usuário
 * @access Private
 */
router.put('/profile', authenticateToken, validateSchema(updateProfileSchema), authController.updateProfile);

/**
 * @route POST /api/auth/forgot-password
 * @desc Solicitar reset de senha
 * @access Public
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @route POST /api/auth/reset-password
 * @desc Resetar senha com token
 * @access Public
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @route GET /api/auth/me
 * @desc Obter dados do usuário autenticado
 * @access Private
 */
router.get('/me', authenticateToken, authController.getProfile);

export default router;
