import { Decimal } from 'decimal.js';
import prisma, { executeTransaction } from '../database/client';
import { AccountDto, CreateAccountDto } from '../types';
import { auditLogger } from '../utils/logger';

export class AccountService {
  async createAccount(userId: string, accountData: CreateAccountDto): Promise<AccountDto> {
    const account = await prisma.account.create({
      data: {
        userId,
        name: accountData.name ?? null,
        type: accountData.type ?? null,
        bank: accountData.bank ?? null,
        agency: accountData.agency ?? null,
        accountNumber: accountData.accountNumber ?? null,
        balance: accountData.initialBalance || new Decimal(0),
      }
    });

    auditLogger.logTransaction(
      userId,
      'ACCOUNT_CREATED',
      { entityType: 'account', entityId: account.id, success: true }
    );

    return this.mapToAccountDto(account);
  }

  async getAccountsByUserId(userId: string): Promise<AccountDto[]> {
    const accounts = await prisma.account.findMany({
      where: { 
        userId,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    return accounts.map(account => this.mapToAccountDto(account));
  }

  async getAccountById(userId: string, accountId: string): Promise<AccountDto | null> {
    const account = await prisma.account.findFirst({
      where: { 
        id: accountId,
        userId,
        isActive: true 
      }
    });

    return account ? this.mapToAccountDto(account) : null;
  }

  async updateAccount(
    userId: string, 
    accountId: string, 
    updateData: Partial<CreateAccountDto>
  ): Promise<AccountDto> {
    // Verificar se a conta pertence ao usuário
    const existingAccount = await this.getAccountById(userId, accountId);
    if (!existingAccount) {
      throw new Error('Conta não encontrada');
    }

    // Monta o objeto data apenas com campos definidos
    const data: any = {};
    if (typeof updateData.name !== 'undefined') data.name = updateData.name;
    if (typeof updateData.type !== 'undefined') data.type = updateData.type;
    if (typeof updateData.bank !== 'undefined') data.bank = updateData.bank;
    if (typeof updateData.agency !== 'undefined') data.agency = updateData.agency;
    if (typeof updateData.accountNumber !== 'undefined') data.accountNumber = updateData.accountNumber;

    const account = await prisma.account.update({
      where: { id: accountId },
      data
    });

    auditLogger.logTransaction(
      userId,
      'ACCOUNT_UPDATED',
      { entityType: 'account', entityId: accountId, success: true }
    );

    return this.mapToAccountDto(account);
  }

  async deleteAccount(userId: string, accountId: string): Promise<void> {
    // Verificar se a conta pertence ao usuário
    const existingAccount = await this.getAccountById(userId, accountId);
    if (!existingAccount) {
      throw new Error('Conta não encontrada');
    }

    // Verificar se há transações na conta
    const transactionsCount = await prisma.transaction.count({
      where: { accountId }
    });

    if (transactionsCount > 0) {
      // Soft delete - apenas desativar a conta
      await prisma.account.update({
        where: { id: accountId },
        data: { isActive: false }
      });
    } else {
      // Hard delete se não há transações
      await prisma.account.delete({
        where: { id: accountId }
      });
    }

    auditLogger.logTransaction(
      userId,
      'ACCOUNT_DELETED',
      { entityType: 'account', entityId: accountId, success: true }
    );
  }

  async updateAccountBalance(
    accountId: string, 
    amount: Decimal, 
    operation: 'ADD' | 'SUBTRACT'
  ): Promise<void> {
    await executeTransaction(async (tx) => {
      const account = await tx.account.findUnique({
        where: { id: accountId }
      });

      if (!account) {
        throw new Error('Conta não encontrada');
      }

      const currentBalance = new Decimal(account.balance.toString());
      let newBalance: Decimal;

      if (operation === 'ADD') {
        newBalance = currentBalance.plus(amount);
      } else {
        newBalance = currentBalance.minus(amount);
        
        // Verificar se o saldo ficará negativo (opcional: permitir ou não)
        if (newBalance.isNegative() && account.type !== 'CHECKING') {
          throw new Error('Saldo insuficiente para esta operação');
        }
      }

      await tx.account.update({
        where: { id: accountId },
        data: { balance: newBalance }
      });
    });
  }

  async getTotalBalance(userId: string): Promise<Decimal> {
    const accounts = await prisma.account.findMany({
      where: { 
        userId,
        isActive: true 
      },
      select: { balance: true }
    });

    return accounts.reduce(
      (total, account) => total.plus(new Decimal(account.balance.toString())),
      new Decimal(0)
    );
  }

  async getAccountsByType(userId: string, type: string): Promise<AccountDto[]> {
    const accounts = await prisma.account.findMany({
      where: { 
        userId,
        type: type as any,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    return accounts.map(account => this.mapToAccountDto(account));
  }

  private mapToAccountDto(account: any): AccountDto {
    return {
      id: account.id,
      userId: account.userId,
      name: account.name,
      type: account.type,
      bank: account.bank,
      agency: account.agency,
      accountNumber: account.accountNumber,
      balance: new Decimal(account.balance.toString()),
      isActive: account.isActive,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
