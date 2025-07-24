import { Decimal } from 'decimal.js';

export interface UserDto {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AccountDto {
  id: string;
  userId: string;
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CRYPTO';
  bank: string;
  agency?: string;
  accountNumber?: string;
  balance: Decimal;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAccountDto {
  name: string;
  type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CRYPTO';
  bank: string;
  agency?: string;
  accountNumber?: string;
  initialBalance?: Decimal;
}

export interface TransactionDto {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string;
  amount: Decimal;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  description: string;
  date: Date;
  referenceNumber?: string;
  extractData?: any;
  isRecurring: boolean;
  recurringType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTransactionDto {
  accountId: string;
  categoryId?: string;
  amount: Decimal;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  description: string;
  date: Date;
  referenceNumber?: string;
  isRecurring?: boolean;
  recurringType?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
}

export interface CategoryDto {
  id: string;
  userId: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color?: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryDto {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  color?: string;
  icon?: string;
}

export interface CreditCardDto {
  id: string;
  userId: string;
  name: string;
  bank: string;
  lastFourDigits: string;
  limit: Decimal;
  closingDay: number;
  dueDay: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCreditCardDto {
  name: string;
  bank: string;
  lastFourDigits: string;
  limit: Decimal;
  closingDay: number;
  dueDay: number;
}

export interface CreditCardTransactionDto {
  id: string;
  creditCardId: string;
  amount: Decimal;
  description: string;
  date: Date;
  installments: number;
  currentInstallment: number;
  merchant?: string;
  category?: string;
  billId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCreditCardTransactionDto {
  creditCardId: string;
  amount: Decimal;
  description: string;
  date: Date;
  installments?: number;
  merchant?: string;
  category?: string;
}

export interface BudgetDto {
  id: string;
  userId: string;
  categoryId: string;
  amount: Decimal;
  spent: Decimal;
  month: number;
  year: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBudgetDto {
  categoryId: string;
  amount: Decimal;
  month: number;
  year: number;
}

export interface DashboardStatsDto {
  totalBalance: Decimal;
  monthlyIncome: Decimal;
  monthlyExpenses: Decimal;
  monthlyBudget: Decimal;
  creditCardDebt: Decimal;
  accountsCount: number;
  transactionsCount: number;
}

export interface MonthlyReportDto {
  month: number;
  year: number;
  income: Decimal;
  expenses: Decimal;
  balance: Decimal;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    amount: Decimal;
    percentage: number;
  }>;
  budgetComparison: Array<{
    categoryId: string;
    categoryName: string;
    budgeted: Decimal;
    spent: Decimal;
    percentage: number;
  }>;
}

export interface BankStatementData {
  date: Date;
  description: string;
  amount: Decimal;
  type: 'INCOME' | 'EXPENSE';
  balance?: Decimal;
  referenceNumber?: string;
}

export interface CreditCardBillData {
  date: Date;
  description: string;
  amount: Decimal;
  installments?: number;
  merchant?: string;
  category?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface JwtPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
