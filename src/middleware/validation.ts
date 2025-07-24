import { NextFunction, Request, Response } from 'express';
import Joi from 'joi';
import { ApiResponse } from '../types';

export const validateSchema = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => detail.message);
      const response: ApiResponse<null> = {
        success: false,
        message: 'Dados inválidos',
        errors
      };
      res.status(400).json(response);
      return;
    }
    
    next();
  };
};

// Schemas de validação
export const createUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ter um formato válido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required().messages({
    'string.min': 'Senha deve ter pelo menos 8 caracteres',
    'string.pattern.base': 'Senha deve conter ao menos: 1 letra minúscula, 1 maiúscula, 1 número e 1 símbolo',
    'any.required': 'Senha é obrigatória'
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome deve ter pelo menos 2 caracteres',
    'string.max': 'Nome deve ter no máximo 100 caracteres',
    'any.required': 'Nome é obrigatório'
  })
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email deve ter um formato válido',
    'any.required': 'Email é obrigatório'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Senha é obrigatória'
  })
});

export const createAccountSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome da conta deve ter pelo menos 2 caracteres',
    'string.max': 'Nome da conta deve ter no máximo 100 caracteres',
    'any.required': 'Nome da conta é obrigatório'
  }),
  type: Joi.string().valid('CHECKING', 'SAVINGS', 'INVESTMENT', 'CRYPTO').required().messages({
    'any.only': 'Tipo deve ser: CHECKING, SAVINGS, INVESTMENT ou CRYPTO',
    'any.required': 'Tipo da conta é obrigatório'
  }),
  bank: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome do banco deve ter pelo menos 2 caracteres',
    'string.max': 'Nome do banco deve ter no máximo 100 caracteres',
    'any.required': 'Banco é obrigatório'
  }),
  agency: Joi.string().max(20).optional(),
  accountNumber: Joi.string().max(20).optional(),
  initialBalance: Joi.number().precision(2).min(0).optional().messages({
    'number.precision': 'Saldo inicial deve ter no máximo 2 casas decimais',
    'number.min': 'Saldo inicial não pode ser negativo'
  })
});

export const createTransactionSchema = Joi.object({
  accountId: Joi.string().uuid().required().messages({
    'string.uuid': 'ID da conta deve ser um UUID válido',
    'any.required': 'ID da conta é obrigatório'
  }),
  categoryId: Joi.string().uuid().optional(),
  amount: Joi.number().precision(2).greater(0).required().messages({
    'number.precision': 'Valor deve ter no máximo 2 casas decimais',
    'number.greater': 'Valor deve ser maior que zero',
    'any.required': 'Valor é obrigatório'
  }),
  type: Joi.string().valid('INCOME', 'EXPENSE', 'TRANSFER').required().messages({
    'any.only': 'Tipo deve ser: INCOME, EXPENSE ou TRANSFER',
    'any.required': 'Tipo da transação é obrigatório'
  }),
  description: Joi.string().min(3).max(255).required().messages({
    'string.min': 'Descrição deve ter pelo menos 3 caracteres',
    'string.max': 'Descrição deve ter no máximo 255 caracteres',
    'any.required': 'Descrição é obrigatória'
  }),
  date: Joi.date().iso().required().messages({
    'date.format': 'Data deve estar no formato ISO',
    'any.required': 'Data é obrigatória'
  }),
  referenceNumber: Joi.string().max(50).optional(),
  isRecurring: Joi.boolean().optional(),
  recurringType: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY').optional()
});

export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Nome da categoria deve ter pelo menos 2 caracteres',
    'string.max': 'Nome da categoria deve ter no máximo 50 caracteres',
    'any.required': 'Nome da categoria é obrigatório'
  }),
  type: Joi.string().valid('INCOME', 'EXPENSE').required().messages({
    'any.only': 'Tipo deve ser: INCOME ou EXPENSE',
    'any.required': 'Tipo da categoria é obrigatório'
  }),
  color: Joi.string().pattern(new RegExp('^#[0-9A-Fa-f]{6}$')).optional().messages({
    'string.pattern.base': 'Cor deve estar no formato hexadecimal (#RRGGBB)'
  }),
  icon: Joi.string().max(50).optional()
});

export const createCreditCardSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome do cartão deve ter pelo menos 2 caracteres',
    'string.max': 'Nome do cartão deve ter no máximo 100 caracteres',
    'any.required': 'Nome do cartão é obrigatório'
  }),
  bank: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Nome do banco deve ter pelo menos 2 caracteres',
    'string.max': 'Nome do banco deve ter no máximo 100 caracteres',
    'any.required': 'Banco é obrigatório'
  }),
  lastFourDigits: Joi.string().length(4).pattern(/^[0-9]+$/).required().messages({
    'string.length': 'Últimos 4 dígitos devem ter exatamente 4 caracteres',
    'string.pattern.base': 'Últimos 4 dígitos devem conter apenas números',
    'any.required': 'Últimos 4 dígitos são obrigatórios'
  }),
  limit: Joi.number().precision(2).min(0).required().messages({
    'number.precision': 'Limite deve ter no máximo 2 casas decimais',
    'number.min': 'Limite não pode ser negativo',
    'any.required': 'Limite é obrigatório'
  }),
  closingDay: Joi.number().integer().min(1).max(31).required().messages({
    'number.min': 'Dia de fechamento deve ser entre 1 e 31',
    'number.max': 'Dia de fechamento deve ser entre 1 e 31',
    'any.required': 'Dia de fechamento é obrigatório'
  }),
  dueDay: Joi.number().integer().min(1).max(31).required().messages({
    'number.min': 'Dia de vencimento deve ser entre 1 e 31',
    'number.max': 'Dia de vencimento deve ser entre 1 e 31',
    'any.required': 'Dia de vencimento é obrigatório'
  })
});

export const createBudgetSchema = Joi.object({
  categoryId: Joi.string().uuid().required().messages({
    'string.uuid': 'ID da categoria deve ser um UUID válido',
    'any.required': 'ID da categoria é obrigatório'
  }),
  amount: Joi.number().precision(2).greater(0).required().messages({
    'number.precision': 'Valor deve ter no máximo 2 casas decimais',
    'number.greater': 'Valor deve ser maior que zero',
    'any.required': 'Valor é obrigatório'
  }),
  month: Joi.number().integer().min(1).max(12).required().messages({
    'number.min': 'Mês deve ser entre 1 e 12',
    'number.max': 'Mês deve ser entre 1 e 12',
    'any.required': 'Mês é obrigatório'
  }),
  year: Joi.number().integer().min(2020).max(2100).required().messages({
    'number.min': 'Ano deve ser maior que 2020',
    'number.max': 'Ano deve ser menor que 2100',
    'any.required': 'Ano é obrigatório'
  })
});
