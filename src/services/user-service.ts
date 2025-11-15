import bcrypt from 'bcrypt';
import { config } from '../config';
import prisma from '../database/client';
import { generateToken } from '../middleware/auth';
import { CreateUserDto, LoginDto, UserDto } from '../types';
import { auditLogger } from '../utils/logger';

export class UserService {
  async createUser(userData: CreateUserDto): Promise<{ user: UserDto; token: string }> {
    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      throw new Error('Email já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(userData.password, config.security.bcryptRounds);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });


    // Gerar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    auditLogger.logTransaction(
      user.id,
      'USER_CREATED',
      { entityType: 'user', entityId: user.id, success: true }
    );

    return { user, token };
  }

  async loginUser(loginData: LoginDto): Promise<{ user: UserDto; token: string }> {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: loginData.email }
    });

    if (!user) {
      auditLogger.logSecurityEvent('LOGIN_FAILED_USER_NOT_FOUND', undefined, undefined, {
        email: loginData.email
      });
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);

    if (!isPasswordValid) {
      auditLogger.logSecurityEvent('LOGIN_FAILED_INVALID_PASSWORD', user.id);
      throw new Error('Credenciais inválidas');
    }

    // Gerar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    auditLogger.logTransaction(
      user.id,
      'USER_LOGIN',
      { entityType: 'user', entityId: user.id, success: true }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token
    };
  }

  async getUserById(userId: string): Promise<UserDto | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });

    return user;
  }

  async updateUser(userId: string, updateData: Partial<CreateUserDto>): Promise<UserDto> {
    const dataToUpdate: any = {};

    if (updateData.name) {
      dataToUpdate.name = updateData.name;
    }

    if (updateData.email) {
      // Verificar se o novo email já está em uso
      const existingUser = await prisma.user.findUnique({
        where: { email: updateData.email }
      });

      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email já está em uso');
      }

      dataToUpdate.email = updateData.email;
    }

    if (updateData.password) {
      dataToUpdate.password = await bcrypt.hash(updateData.password, config.security.bcryptRounds);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      }
    });

    auditLogger.logTransaction(
      userId,
      'USER_UPDATED',
      { entityType: 'user', entityId: userId, success: true }
    );

    return user;
  }

  private async createDefaultCategories(userId: string): Promise<void> {
    const defaultCategories = [
      // Categorias de receita
      { name: 'Salário', type: 'INCOME' as const, color: '#4CAF50', icon: '💰' },
      { name: 'Freelance', type: 'INCOME' as const, color: '#2196F3', icon: '💻' },
      { name: 'Investimentos', type: 'INCOME' as const, color: '#FF9800', icon: '📈' },
      { name: 'Outros', type: 'INCOME' as const, color: '#9C27B0', icon: '💵' },

      // Categorias de despesa
      { name: 'Alimentação', type: 'EXPENSE' as const, color: '#F44336', icon: '🍽️' },
      { name: 'Transporte', type: 'EXPENSE' as const, color: '#FF5722', icon: '🚗' },
      { name: 'Moradia', type: 'EXPENSE' as const, color: '#795548', icon: '🏠' },
      { name: 'Saúde', type: 'EXPENSE' as const, color: '#E91E63', icon: '🏥' },
      { name: 'Educação', type: 'EXPENSE' as const, color: '#3F51B5', icon: '📚' },
      { name: 'Lazer', type: 'EXPENSE' as const, color: '#9C27B0', icon: '🎬' },
      { name: 'Roupas', type: 'EXPENSE' as const, color: '#607D8B', icon: '👕' },
      { name: 'Impostos', type: 'EXPENSE' as const, color: '#424242', icon: '📋' },
      { name: 'Supermercado', type: 'EXPENSE' as const, color: '#4CAF50', icon: '🛒' },
      { name: 'Farmácia', type: 'EXPENSE' as const, color: '#00BCD4', icon: '💊' },
      { name: 'Cartão de Crédito', type: 'EXPENSE' as const, color: '#FF9800', icon: '💳' },
    ];

    await prisma.category.createMany({
      data: defaultCategories.map(category => ({
        ...category,
        userId,
      }))
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    // Buscar usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Por segurança, não revelar se o email existe ou não
    if (!user) {
      auditLogger.logTransaction(
        'SYSTEM',
        'PASSWORD_RESET_REQUESTED',
        { email, found: false }
      );
      return;
    }

    // Gerar token de reset (válido por 1 hora)
    const resetToken = generateToken(
      { userId: user.id, email: user.email, type: 'password-reset' },
      '1h'
    );

    // Calcular data de expiração (1 hora a partir de agora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Salvar token no banco de dados
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: expiresAt
      }
    });

    // TODO: Implementar envio de email
    // Por enquanto, apenas logar o token (em produção, enviar por email)
    console.log('\n===========================================');
    console.log('🔐 TOKEN DE RESET DE SENHA');
    console.log('===========================================');
    console.log('Email:', email);
    console.log('Token:', resetToken);
    console.log('Link de reset:', `http://localhost:8080/reset-password.html?token=${resetToken}`);
    console.log('Expira em:', expiresAt.toLocaleString('pt-BR'));
    console.log('===========================================\n');

    auditLogger.logTransaction(
      user.id,
      'PASSWORD_RESET_REQUESTED',
      { email, success: true }
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Verificar e decodificar o token JWT
      const decoded = require('jsonwebtoken').verify(token, config.jwt.secret) as any;

      if (decoded.type !== 'password-reset') {
        throw new Error('Token inválido');
      }

      // Buscar usuário com o token
      const user = await prisma.user.findFirst({
        where: {
          id: decoded.userId,
          passwordResetToken: token
        }
      });

      if (!user) {
        throw new Error('Token inválido ou já utilizado');
      }

      // Verificar se o token expirou
      if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
        throw new Error('Token expirado. Solicite um novo reset de senha.');
      }

      // Hash da nova senha
      const hashedPassword = await bcrypt.hash(newPassword, config.security.bcryptRounds);

      // Atualizar senha e limpar token de reset
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null
        }
      });

      auditLogger.logTransaction(
        user.id,
        'PASSWORD_RESET_COMPLETED',
        { success: true }
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw new Error('Token expirado. Solicite um novo reset de senha.');
        }
        if (error.name === 'JsonWebTokenError') {
          throw new Error('Token inválido');
        }
        // Re-throw custom errors
        throw error;
      }
      throw new Error('Erro ao resetar senha');
    }
  }
}
