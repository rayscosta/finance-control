import { Request, Response } from 'express';
import { UserService } from '../services/user-service';
import { ApiResponse } from '../types';
import { auditLogger } from '../utils/logger';

export class AuthController {
  private userService = new UserService();

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user, token } = await this.userService.createUser(req.body);

      const response: ApiResponse<{ user: any; token: string }> = {
        success: true,
        data: { user, token },
        message: 'Usuário criado com sucesso'
      };

      res.status(201).json(response);
    } catch (error) {
      auditLogger.logError(error as Error, { 
        operation: 'user_registration',
        email: req.body.email,
        ip: req.ip 
      });

      const response: ApiResponse<null> = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      };

      res.status(400).json(response);
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user, token } = await this.userService.loginUser(req.body);

      const response: ApiResponse<{ user: any; token: string }> = {
        success: true,
        data: { user, token },
        message: 'Login realizado com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      auditLogger.logError(error as Error, { 
        operation: 'user_login',
        email: req.body.email,
        ip: req.ip 
      });

      const response: ApiResponse<null> = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      };

      res.status(401).json(response);
    }
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Usuário não autenticado'
        };
        res.status(401).json(response);
        return;
      }

      const user = await this.userService.getUserById(req.user.userId);

      if (!user) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Usuário não encontrado'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<any> = {
        success: true,
        data: user,
        message: 'Perfil obtido com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      auditLogger.logError(error as Error, { 
        operation: 'get_profile',
        userId: req.user?.userId,
        ip: req.ip 
      });

      const response: ApiResponse<null> = {
        success: false,
        message: 'Erro interno do servidor'
      };

      res.status(500).json(response);
    }
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Usuário não autenticado'
        };
        res.status(401).json(response);
        return;
      }

      const user = await this.userService.updateUser(req.user.userId, req.body);

      const response: ApiResponse<any> = {
        success: true,
        data: user,
        message: 'Perfil atualizado com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      auditLogger.logError(error as Error, { 
        operation: 'update_profile',
        userId: req.user?.userId,
        ip: req.ip 
      });

      const response: ApiResponse<null> = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      };

      res.status(400).json(response);
    }
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Email é obrigatório'
        };
        res.status(400).json(response);
        return;
      }

      // Por segurança, sempre retornar sucesso mesmo se o email não existir
      // Isso previne enumeration attacks
      await this.userService.requestPasswordReset(email);

      const response: ApiResponse<null> = {
        success: true,
        message: 'Se o email existir em nossa base, você receberá instruções para resetar sua senha.'
      };

      res.status(200).json(response);
    } catch (error) {
      auditLogger.logError(error as Error, { 
        operation: 'forgot_password',
        email: req.body.email,
        ip: req.ip 
      });

      const response: ApiResponse<null> = {
        success: false,
        message: 'Erro ao processar solicitação'
      };

      res.status(500).json(response);
    }
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Token e nova senha são obrigatórios'
        };
        res.status(400).json(response);
        return;
      }

      if (newPassword.length < 6) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'A senha deve ter pelo menos 6 caracteres'
        };
        res.status(400).json(response);
        return;
      }

      await this.userService.resetPassword(token, newPassword);

      const response: ApiResponse<null> = {
        success: true,
        message: 'Senha resetada com sucesso. Você já pode fazer login.'
      };

      res.status(200).json(response);
    } catch (error) {
      auditLogger.logError(error as Error, { 
        operation: 'reset_password',
        ip: req.ip 
      });

      const response: ApiResponse<null> = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro ao resetar senha'
      };

      res.status(400).json(response);
    }
  };
}
