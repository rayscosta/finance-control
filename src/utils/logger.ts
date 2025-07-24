import winston from 'winston';
import { config } from '../config';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: config.nodeEnv === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'finance-control' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Função para log de auditoria de transações financeiras
export const auditLogger = {
  logTransaction: (userId: string, action: string, data: any, ipAddress?: string) => {
    logger.info('AUDIT: Financial Transaction', {
      userId,
      action,
      timestamp: new Date().toISOString(),
      ipAddress,
      // NUNCA log valores monetários ou dados sensíveis diretamente
      entityType: data.entityType,
      entityId: data.entityId,
      success: data.success,
    });
  },

  logSecurityEvent: (event: string, userId?: string, ipAddress?: string, details?: any) => {
    logger.warn('SECURITY EVENT', {
      event,
      userId,
      ipAddress,
      timestamp: new Date().toISOString(),
      details: details ? JSON.stringify(details) : undefined,
    });
  },

  logError: (error: Error, context?: any) => {
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }
};

export default logger;
