import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import path from 'path';
import { config } from './config';
import logger from './utils/logger';

import accountRoutes from './routes/account-routes';
import authRoutes from './routes/auth-routes';
import categoryRoutes from './routes/categories';
import userRoutes from './routes/user-routes';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com', 'https://fonts.googleapis.com'],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
      fontSrc: ["'self'", 'https://cdnjs.cloudflare.com', 'https://fonts.gstatic.com', 'data:', 'https://r2cdn.perplexity.ai'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'http://localhost:3000', 'http://localhost:8080']
    }
  }
}));

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8080', 'http://127.0.0.1:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.nodeEnv === 'development' ? 1000 : config.security.rateLimitMaxRequests,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em alguns minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

if (config.nodeEnv === 'production') {
  app.use(limiter);
} else {
  logger.warn('Rate limiting desabilitado em desenvolvimento');
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Finance Control API está funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get(['/login', '/login.html'], (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);

app.use(express.static(path.join(__dirname, '../public')));

app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota da API não encontrada'
  });
});

app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../public/404.html'));
});

app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(500).json({
    success: false,
    message: config.nodeEnv === 'production' ? 'Erro interno do servidor' : error.message
  });
});

export { app };
export default app;
