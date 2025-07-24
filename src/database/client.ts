import { Prisma, PrismaClient } from '@prisma/client';
import { config } from '../config';
import logger from '../utils/logger';

// Configuração do Prisma com logging e middleware de auditoria
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log de queries apenas em desenvolvimento
if (config.nodeEnv === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Database Query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });
}

// Log de erros do banco
prisma.$on('error', (e) => {
  logger.error('Database Error', {
    target: e.target,
    message: e.message,
  });
});

// Middleware de auditoria para transações financeiras
prisma.$use(async (params, next) => {
  const start = Date.now();
  
  // Intercepta operações em entidades financeiras críticas
  const criticalTables = ['transactions', 'credit_card_transactions', 'accounts', 'budgets'];
  
  if (criticalTables.includes(params.model || '')) {
    logger.info('Critical Operation Attempt', {
      model: params.model,
      action: params.action,
      timestamp: new Date().toISOString(),
    });
  }
  
  try {
    const result = await next(params);
    const duration = Date.now() - start;
    
    // Log operações que demoram mais que 1 segundo
    if (duration > 1000) {
      logger.warn('Slow Database Operation', {
        model: params.model,
        action: params.action,
        duration: `${duration}ms`,
      });
    }
    
    return result;
  } catch (error) {
    logger.error('Database Operation Failed', {
      model: params.model,
      action: params.action,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
});

// Função para executar transações com rollback automático
export const executeTransaction = async <T>(
  operations: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(async (tx) => {
    try {
      return await operations(tx);
    } catch (error) {
      logger.error('Transaction rolled back', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  });
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
