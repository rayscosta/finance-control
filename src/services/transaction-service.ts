import { Decimal } from 'decimal.js';
import prisma, { executeTransaction } from '../database/client';
import { CreateTransactionDto, PaginatedResponse, TransactionDto } from '../types';
import { auditLogger } from '../utils/logger';
import { AccountService } from './account-service';

export class TransactionService {
  private accountService = new AccountService();

  async createTransaction(userId: string, transactionData: CreateTransactionDto): Promise<TransactionDto> {
    // Verificar se a conta pertence ao usuário
    const account = await this.accountService.getAccountById(userId, transactionData.accountId);
    if (!account) {
      throw new Error('Conta não encontrada');
    }

    // Verificar se a categoria pertence ao usuário (se fornecida)
    if (transactionData.categoryId) {
      const category = await prisma.category.findFirst({
        where: { 
          id: transactionData.categoryId,
          userId,
          isActive: true 
        }
      });

      if (!category) {
        throw new Error('Categoria não encontrada');
      }

      // Validar se o tipo da transação é compatível com o tipo da categoria
      if (
        (transactionData.type === 'INCOME' && category.type !== 'INCOME') ||
        (transactionData.type === 'EXPENSE' && category.type !== 'EXPENSE')
      ) {
        throw new Error('Tipo da transação incompatível com o tipo da categoria');
      }
    }

    const transaction = await executeTransaction(async (tx) => {
      // Criar transação
      const newTransaction = await tx.transaction.create({
        data: {
          userId,
          accountId: transactionData.accountId,
          categoryId: transactionData.categoryId || null,
          amount: transactionData.amount,
          type: transactionData.type,
          description: transactionData.description,
          date: transactionData.date,
          referenceNumber: transactionData.referenceNumber || null,
          isRecurring: transactionData.isRecurring || false,
          recurringType: transactionData.recurringType || null,
        }
      });

      // Atualizar saldo da conta
      await this.updateAccountBalanceForTransaction(
        transactionData.accountId,
        transactionData.amount,
        transactionData.type,
        tx
      );

      // Atualizar orçamento se aplicável
      if (transactionData.categoryId && transactionData.type === 'EXPENSE') {
        await this.updateBudgetSpent(
          userId,
          transactionData.categoryId,
          transactionData.amount,
          transactionData.date,
          tx
        );
      }

      return newTransaction;
    });

    auditLogger.logTransaction(
      userId,
      'TRANSACTION_CREATED',
      { 
        entityType: 'transaction', 
        entityId: transaction.id, 
        success: true 
      }
    );

    return this.mapToTransactionDto(transaction);
  }

  async getTransactionsByUser(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      accountId?: string;
      categoryId?: string;
      type?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<PaginatedResponse<TransactionDto>> {
    const skip = (page - 1) * limit;
    
    const where: any = { userId };

    if (filters?.accountId) where.accountId = filters.accountId;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.type) where.type = filters.type;
    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = filters.startDate;
      if (filters.endDate) where.date.lte = filters.endDate;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: { select: { name: true, bank: true } },
          category: { select: { name: true, color: true, icon: true } }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where })
    ]);

    const mappedTransactions = transactions.map(transaction => this.mapToTransactionDto(transaction));

    return {
      success: true,
      data: mappedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async getTransactionById(userId: string, transactionId: string): Promise<TransactionDto | null> {
    const transaction = await prisma.transaction.findFirst({
      where: { 
        id: transactionId,
        userId 
      },
      include: {
        account: { select: { name: true, bank: true } },
        category: { select: { name: true, color: true, icon: true } }
      }
    });

    return transaction ? this.mapToTransactionDto(transaction) : null;
  }

  async updateTransaction(
    userId: string,
    transactionId: string,
    updateData: Partial<CreateTransactionDto>
  ): Promise<TransactionDto> {
    const existingTransaction = await this.getTransactionById(userId, transactionId);
    if (!existingTransaction) {
      throw new Error('Transação não encontrada');
    }

    const transaction = await executeTransaction(async (tx) => {
      // Reverter o impacto da transação original no saldo
      await this.updateAccountBalanceForTransaction(
        existingTransaction.accountId,
        existingTransaction.amount,
        existingTransaction.type,
        tx,
        true // reverter
      );

      // Reverter impacto no orçamento se aplicável
      if (existingTransaction.categoryId && existingTransaction.type === 'EXPENSE') {
        await this.updateBudgetSpent(
          userId,
          existingTransaction.categoryId,
          existingTransaction.amount.negated(),
          existingTransaction.date,
          tx
        );
      }

      // Atualizar transação
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: updateData,
        include: {
          account: { select: { name: true, bank: true } },
          category: { select: { name: true, color: true, icon: true } }
        }
      });

      // Aplicar novo impacto no saldo
      await this.updateAccountBalanceForTransaction(
        updateData.accountId || existingTransaction.accountId,
        updateData.amount || existingTransaction.amount,
        updateData.type || existingTransaction.type,
        tx
      );

      // Aplicar novo impacto no orçamento se aplicável
      const newCategoryId = updateData.categoryId || existingTransaction.categoryId;
      const newType = updateData.type || existingTransaction.type;
      const newAmount = updateData.amount || existingTransaction.amount;
      const newDate = updateData.date || existingTransaction.date;

      if (newCategoryId && newType === 'EXPENSE') {
        await this.updateBudgetSpent(
          userId,
          newCategoryId,
          newAmount,
          newDate,
          tx
        );
      }

      return updatedTransaction;
    });

    auditLogger.logTransaction(
      userId,
      'TRANSACTION_UPDATED',
      { 
        entityType: 'transaction', 
        entityId: transactionId, 
        success: true 
      }
    );

    return this.mapToTransactionDto(transaction);
  }

  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    const existingTransaction = await this.getTransactionById(userId, transactionId);
    if (!existingTransaction) {
      throw new Error('Transação não encontrada');
    }

    await executeTransaction(async (tx) => {
      // Reverter o impacto da transação no saldo
      await this.updateAccountBalanceForTransaction(
        existingTransaction.accountId,
        existingTransaction.amount,
        existingTransaction.type,
        tx,
        true // reverter
      );

      // Reverter impacto no orçamento se aplicável
      if (existingTransaction.categoryId && existingTransaction.type === 'EXPENSE') {
        await this.updateBudgetSpent(
          userId,
          existingTransaction.categoryId,
          existingTransaction.amount.negated(),
          existingTransaction.date,
          tx
        );
      }

      // Deletar transação
      await tx.transaction.delete({
        where: { id: transactionId }
      });
    });

    auditLogger.logTransaction(
      userId,
      'TRANSACTION_DELETED',
      { 
        entityType: 'transaction', 
        entityId: transactionId, 
        success: true 
      }
    );
  }

  private async updateAccountBalanceForTransaction(
    accountId: string,
    amount: Decimal,
    type: string,
    tx: any,
    revert: boolean = false
  ): Promise<void> {
    const account = await tx.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      throw new Error('Conta não encontrada');
    }

    const currentBalance = new Decimal(account.balance.toString());
    let newBalance: Decimal;

    // Determinar operação baseada no tipo e se é reversão
    const shouldAdd = revert 
      ? (type === 'EXPENSE') // Se reverter, expense vira adição
      : (type === 'INCOME'); // Se não reverter, income é adição

    if (shouldAdd) {
      newBalance = currentBalance.plus(amount);
    } else {
      newBalance = currentBalance.minus(amount);
    }

    await tx.account.update({
      where: { id: accountId },
      data: { balance: newBalance }
    });
  }

  private async updateBudgetSpent(
    userId: string,
    categoryId: string,
    amount: Decimal,
    date: Date,
    tx: any
  ): Promise<void> {
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const budget = await tx.budget.findUnique({
      where: {
        userId_categoryId_month_year: {
          userId,
          categoryId,
          month,
          year
        }
      }
    });

    if (budget) {
      const currentSpent = new Decimal(budget.spent.toString());
      const newSpent = currentSpent.plus(amount);

      await tx.budget.update({
        where: {
          userId_categoryId_month_year: {
            userId,
            categoryId,
            month,
            year
          }
        },
        data: { spent: newSpent }
      });
    }
  }

  private mapToTransactionDto(transaction: any): TransactionDto {
    return {
      id: transaction.id,
      userId: transaction.userId,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      amount: new Decimal(transaction.amount.toString()),
      type: transaction.type,
      description: transaction.description,
      date: transaction.date,
      referenceNumber: transaction.referenceNumber,
      extractData: transaction.extractData,
      isRecurring: transaction.isRecurring,
      recurringType: transaction.recurringType,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
