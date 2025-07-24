import { Request, Response } from 'express';
import { AccountService } from '../services/account-service';
import { ApiResponse } from '../types';
import { auditLogger } from '../utils/logger';

export class AccountController {
  private accountService = new AccountService();

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Usuário não autenticado'
        };
        res.status(401).json(response);
        return;
      }

      const account = await this.accountService.createAccount(req.user.userId, req.body);

      const response: ApiResponse<any> = {
        success: true,
        data: account,
        message: 'Conta criada com sucesso'
      };

      res.status(201).json(response);
    } catch (error) {
      auditLogger.logError(error as Error, { 
        operation: 'create_account',
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

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Usuário não autenticado'
        };
        res.status(401).json(response);
        return;
      }

      const accounts = await this.accountService.getAccountsByUserId(req.user.userId);

      const response: ApiResponse<any[]> = {
        success: true,
        data: accounts,
        message: 'Contas obtidas com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      auditLogger.logError(error as Error, { 
        operation: 'get_accounts',
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

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Usuário não autenticado'
        };
        res.status(401).json(response);
        return;
      }

      const id = req.params.id ?? '';
      const account = await this.accountService.getAccountById(req.user.userId, id);

      if (!account) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Conta não encontrada'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<any> = {
        success: true,
        data: account,
        message: 'Conta obtida com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      auditLogger.logError(error as Error, { 
        operation: 'get_account_by_id',
        userId: req.user?.userId,
        accountId: req.params.id,
        ip: req.ip 
      });

      const response: ApiResponse<null> = {
        success: false,
        message: 'Erro interno do servidor'
      };

      res.status(500).json(response);
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Usuário não autenticado'
        };
        res.status(401).json(response);
        return;
      }

      const id = req.params.id ?? '';
      const account = await this.accountService.updateAccount(req.user.userId, id, req.body);

      const response: ApiResponse<any> = {
        success: true,
        data: account,
        message: 'Conta atualizada com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      auditLogger.logError(error as Error, { 
        operation: 'update_account',
        userId: req.user?.userId,
        accountId: req.params.id,
        ip: req.ip 
      });

      const response: ApiResponse<null> = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      };

      res.status(400).json(response);
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Usuário não autenticado'
        };
        res.status(401).json(response);
        return;
      }

      const id = req.params.id ?? '';
      await this.accountService.deleteAccount(req.user.userId, id);

      const response: ApiResponse<null> = {
        success: true,
        message: 'Conta excluída com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      auditLogger.logError(error as Error, { 
        operation: 'delete_account',
        userId: req.user?.userId,
        accountId: req.params.id,
        ip: req.ip 
      });

      const response: ApiResponse<null> = {
        success: false,
        message: error instanceof Error ? error.message : 'Erro interno do servidor'
      };

      res.status(400).json(response);
    }
  };

  getTotalBalance = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Usuário não autenticado'
        };
        res.status(401).json(response);
        return;
      }

      const totalBalance = await this.accountService.getTotalBalance(req.user.userId);

      const response: ApiResponse<{ totalBalance: string }> = {
        success: true,
        data: { totalBalance: totalBalance.toString() },
        message: 'Saldo total obtido com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      auditLogger.logError(error as Error, { 
        operation: 'get_total_balance',
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

  getByType = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        const response: ApiResponse<null> = {
          success: false,
          message: 'Usuário não autenticado'
        };
        res.status(401).json(response);
        return;
      }

      const type = typeof req.query.type === 'string' ? req.query.type : '';
      const accounts = await this.accountService.getAccountsByType(req.user.userId, type);

      const response: ApiResponse<any[]> = {
        success: true,
        data: accounts,
        message: 'Contas por tipo obtidas com sucesso'
      };

      res.status(200).json(response);
    } catch (error) {
      auditLogger.logError(error as Error, { 
        operation: 'get_accounts_by_type',
        userId: req.user?.userId,
        type: req.params.type,
        ip: req.ip 
      });

      const response: ApiResponse<null> = {
        success: false,
        message: 'Erro interno do servidor'
      };

      res.status(500).json(response);
    }
  };
}
