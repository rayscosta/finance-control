import { app } from './app';
import { config } from './config';
import logger from './utils/logger';

const server = app.listen(config.port, () => {
  logger.info(`Servidor iniciado na porta ${config.port}`, {
    environment: config.nodeEnv,
    port: config.port
  });
});

const gracefulShutdown = (signal: NodeJS.Signals) => {
  logger.info(`${signal} received, shutting down gracefully`);
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
